import { Client, TextChannel, userMention } from 'discord.js'
import { inspect } from 'util'

const LOG_CHANNEL_ID = '1552053596294488084'
const ERROR_NOTIFY_USER_ID = process.env.DISCORD_CONSOLE_ERROR_USER_ID
const MAX_LENGTH = 1900
const METHODS = ['log', 'info', 'warn', 'error', 'debug'] as const

type ConsoleMethod = (typeof METHODS)[number]

type QueuedLog = {
  level: ConsoleMethod
  content: string
  mentionOnError: boolean
}

function formatArg(arg: unknown): string {
  if (typeof arg === 'string') {
    return arg
  }

  if (arg instanceof Error) {
    return arg.stack || arg.message
  }

  return inspect(arg, { depth: 4, colors: false, breakLength: 120 })
}

function levelPrefix(level: ConsoleMethod, mention = false): string {
  if (mention && ERROR_NOTIFY_USER_ID) {
    return `\`[${level}]\` ${userMention(ERROR_NOTIFY_USER_ID)} `
  }

  return `\`[${level}]\` `
}

export function setupDiscordConsole(client: Client) {
  const originals = Object.fromEntries(METHODS.map((method) => [method, console[method].bind(console)])) as Record<
    ConsoleMethod,
    (...args: unknown[]) => void
  >

  const queue: QueuedLog[] = []
  let flushing = false
  let flushTimer: ReturnType<typeof setTimeout> | null = null
  let channel: TextChannel | null = null

  async function getChannel() {
    if (channel) {
      return channel
    }

    const fetched = await client.channels.fetch(LOG_CHANNEL_ID)
    if (fetched instanceof TextChannel) {
      channel = fetched
      return channel
    }

    return null
  }

  function canSend() {
    return Boolean(client.isReady() && client.token)
  }

  async function flush() {
    if (flushing || queue.length === 0) {
      return
    }

    if (!canSend()) {
      queue.length = 0
      return
    }

    flushing = true

    try {
      const target = await getChannel()
      if (!target) {
        originals.error('[discord-console] Log channel not found:', LOG_CHANNEL_ID)
        queue.length = 0
        return
      }

      while (queue.length > 0) {
        if (!canSend()) {
          queue.length = 0
          break
        }

        const entry = queue.shift()!
        try {
          await target.send({
            content: entry.content,
            allowedMentions:
              entry.mentionOnError && ERROR_NOTIFY_USER_ID
                ? { users: [ERROR_NOTIFY_USER_ID] }
                : { parse: [] },
          })
        } catch (error) {
          originals.error('[discord-console] Failed to send log message', error)
        }
      }
    } finally {
      flushing = false
      if (queue.length > 0 && canSend()) {
        scheduleFlush()
      } else {
        queue.length = 0
      }
    }
  }

  function scheduleFlush() {
    if (!canSend()) {
      queue.length = 0
      return
    }

    if (flushTimer) {
      clearTimeout(flushTimer)
    }

    flushTimer = setTimeout(() => {
      flushTimer = null
      void flush()
    }, 250)
  }

  function mirror(level: ConsoleMethod, args: unknown[]) {
    const body = args.map(formatArg).join(' ').trim()
    if (!body) {
      return
    }

    const last = queue[queue.length - 1]
    const line = `${levelPrefix(level)}${body}`
    if (last?.level === level) {
      const combined = `${last.content}\n${line}`
      if (combined.length <= MAX_LENGTH) {
        last.content = combined
        scheduleFlush()
        return
      }
    }

    queue.push({
      level,
      content: `${levelPrefix(level, level === 'error')}${body}`.slice(0, MAX_LENGTH),
      mentionOnError: level === 'error',
    })
    scheduleFlush()
  }

  for (const method of METHODS) {
    console[method] = (...args: unknown[]) => {
      originals[method](...args)

      try {
        mirror(method, args)
      } catch (error) {
        originals.error('[discord-console] Mirror failed', error)
      }
    }
  }
}
