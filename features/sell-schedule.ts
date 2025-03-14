import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  Message,
  MessageFlags,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  StringSelectMenuOptionBuilder,
  TextChannel,
} from 'discord.js'
import { sellChannels, isValidSellChannel, getRegion } from '../constants/sellChannels.ts'
import Queue, { QueueWorkerCallback } from 'queue'
import generateIcs from './sell-schedule/generateIcs.ts'
import { logRequestSignups } from '../firestore/log.ts'

const MCMysticCoinEmoji = '545057156274323486'

export default function (client: Client, scheduleChannelIds: { id: string; regions: string[] }[]) {
  const q = new Queue({ autostart: true, concurrency: 1 })
  const schedule: ScheduleMessage[] = []
  let writtenSchedule: string[] = []
  let isStarting = true

  client.once('ready', async () => {
    try {
      for (let i = 0; i < scheduleChannelIds.length; i++) {
        const channelInfo = scheduleChannelIds[i]

        const channel = await client.channels.fetch(channelInfo.id)

        if (channel && channel instanceof TextChannel) {
          let message = await channel.messages
            .fetch()
            .then((messages) => messages.filter((message) => message.author.id === client.user?.id))
            .then((messages) => messages.at(0))

          if (!message) {
            await channel.send('Loading history...')
          }
        }
      }

      for (const sellChannelId in sellChannels) {
        try {
          const sellChannel = await client.channels.fetch(sellChannelId)

          if (sellChannel && sellChannel instanceof TextChannel) {
            let sellMessages = await sellChannel.messages
              .fetch()
              .then((messages) => messages.filter((message) => message.content.includes('<t:')))

            if (sellMessages) {
              for (const sellMessage of sellMessages.values()) {
                await addToSchedule(sellMessage)
              }
            }
          }
        } catch (e: any) {
          console.error(e)
          continue
        }
      }

      console.log('loaded schedule', schedule.length)

      const endListener = () => {
        isStarting = false

        q.removeEventListener('end', endListener)
      }

      q.addEventListener('end', endListener)

      await createMessages()
    } catch (e: any) {
      console.error('---- AN ERROR WAS THROWN ----')
      console.error('message', e.rawError?.message)
      console.error('content', e.requestBody?.json?.content)
      console.error('---- END ERROR ----')

      if (e.rawError?.message === 'Missing Permissions' || e.rawError?.message === 'Missing Access') {
        return
      }

      console.error(e)
    }
  })

  client.on('messageCreate', async (message) => {
    if (message.author.bot || message.system) return

    try {
      let region = getRegion(message.channelId)

      if (region) {
        if (message.content.includes('<t:')) {
          await addToSchedule(message)

          await createMessages(undefined, region)
        }
      }
    } catch (e: any) {
      if (e.rawError?.message === 'Missing Permissions') {
        return
      }

      console.error(e)
    }
  })

  client.on('messageDelete', async (message) => {
    const index = schedule.findIndex((value) => value.id === message.id)

    if (index < 0) {
      return
    }

    if (message.hasThread) {
      try {
        await message.thread!.delete()
      } catch (e) {
        console.error('--- ERROR: Failed to delete thread ---')
        console.error(e)
      }
    }

    schedule.splice(index, 1)

    let region = getRegion(message.channelId)

    await createMessages(undefined, region || undefined)
  })

  client.on('messageDeleteBulk', async (messages) => {
    const regions = new Set<string>()

    for (let i = 0; i < messages.size; i++) {
      let message = messages.at(i)!

      const index = schedule.findIndex((value) => value.id === message.id)

      if (index < 0) {
        continue
      }

      if (message.hasThread) {
        try {
          await message.thread!.delete()
        } catch (e) {
          console.error('--- ERROR: Failed to delete thread (from bulk) ---')
          console.error(e)
        }
      }

      let region = getRegion(message.channelId)

      if (region) {
        regions.add(region)
      }

      schedule.splice(index, 1)
    }

    await createMessages(undefined, Array.from(regions))
  })

  client.on('messageUpdate', async (_, updatedMessage) => {
    const messageIndex = schedule.findIndex((message) => message.id === updatedMessage.id)

    if (messageIndex !== -1) {
      if (updatedMessage.partial) {
        updatedMessage = await updatedMessage.fetch()
      }

      const match = getTimestampMatch(updatedMessage.content)
      const timeText = extractTimeText(match)
      const timestamp = extractTimestamp(match)
      schedule[messageIndex].date = timestamp
      schedule[messageIndex].text = getSortedMessage(updatedMessage, timeText)

      let region = getRegion(updatedMessage.channelId)

      await createMessages(undefined, region || undefined)
    } else {
      // If something was updated and became matching, add it
      if (isValidSellChannel(updatedMessage.channelId)) {
        if (updatedMessage.partial) {
          updatedMessage = await updatedMessage.fetch()
        }

        if (updatedMessage.content.includes('<t:')) {
          await addToSchedule(updatedMessage)

          let region = getRegion(updatedMessage.channelId)
          await createMessages(undefined, region || undefined)
        }
      }
    }
  })

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) {
      if (interaction.isStringSelectMenu()) {
        return downloadIcs(interaction)
      }

      return
    }

    if (isStarting) {
      await interaction.reply({
        content: "I'm still booting, please try again in at least 10 seconds.",
        flags: MessageFlags.Ephemeral,
      })
      return
    }

    try {
      const id = interaction.customId

      if (id.startsWith('my-schedule-')) {
        await interaction.deferReply({
          flags: MessageFlags.Ephemeral,
        })

        const regions = id.replace('my-schedule-', '').split('-')

        const result = schedule.filter((message) => {
          return message.reactors.includes(interaction.user.id) && regions.includes(message.region)
        })

        logRequestSignups(interaction.user.id, interaction.user.username, result.length)

        if (!result.length) {
          await interaction.editReply({
            content: "You didn't sign up to anything!",
          })
        } else {
          const downloadSelect = new StringSelectMenuBuilder()
            .setCustomId('my-schedule-download-select')
            .setPlaceholder('Select items to download calendars for')
            .setMinValues(1)
            .setMaxValues(Math.min(10, result.length))
            .addOptions(
              ...result.map((item) => {
                const text = getPrunedOutput([item])[0][0]

                const timestampPattern = /<t:\d+:[a-zA-Z]>/
                const urlPattern = /https:\/\/discord\.com\/channels\/\d+\/\d+\/\d+/

                let prunedMessage = text.replace(timestampPattern, '').replace(urlPattern, '')

                prunedMessage = `[${item.region}] ${prunedMessage.trim()}`.slice(0, 100)

                return new StringSelectMenuOptionBuilder().setLabel(prunedMessage).setValue(`${item.id}`)
              }),
            )

          const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(downloadSelect)

          await interaction.editReply({
            content: getPrunedOutput(result, true)[0].join('\r\n\r\n'),
            components: [row],
          })
        }
      }
    } catch (e: any) {
      console.error(`Sell-schedule reply failed: ${e.rawError?.message}` || 'Something went wrong?')

      if (e.rawError?.message !== 'Unknown interaction') {
        console.error(e)
      }

      try {
        await interaction.editReply({
          content: 'Oops, there was an error loading your schedule',
        })
        return
      } catch {
        console.error('--- ERROR: Was not allowed to reply to interaction ---')
      }
    }
  })

  client.on('messageReactionAdd', async (reaction, user) => {
    const matchingHistoryItem = schedule.find((item) => item.id === reaction.message.id)

    if (!matchingHistoryItem || reaction.emoji.id !== MCMysticCoinEmoji) {
      return
    }

    matchingHistoryItem.reactors.push(user.id)
  })

  client.on('messageReactionRemove', async (reaction, user) => {
    const matchingHistoryItem = schedule.find((item) => item.id === reaction.message.id)

    if (!matchingHistoryItem || reaction.emoji.id !== MCMysticCoinEmoji) {
      return
    }

    const index = matchingHistoryItem.reactors.indexOf(user.id)
    if (index > -1) {
      // only splice array when item is found
      matchingHistoryItem.reactors.splice(index, 1) // 2nd parameter means remove one item only
    }
  })

  async function addToSchedule(message: Message<boolean>) {
    const match = getTimestampMatch(message.content)
    const timeText = extractTimeText(match)
    const timestamp = extractTimestamp(match)
    let userIds: string[] = []

    let messageReaction = message.reactions.cache.get(MCMysticCoinEmoji)

    if (messageReaction) {
      if (messageReaction.partial) {
        messageReaction = await messageReaction.fetch()
      }

      const users = await messageReaction.users.fetch()
      userIds = users.map((_, id) => {
        return id
      })
    }

    schedule.push({
      id: message.id,
      channelId: message.channelId,
      region: getRegion(message.channelId)!,
      reactors: userIds,
      date: timestamp,
      text: getSortedMessage(message, timeText),
    })
  }

  async function createMessages(_callback?: QueueWorkerCallback, updatedRegion?: string | string[]) {
    const queueFunction = async () => {
      if (writtenSchedule.length === schedule.length) {
        const currentMap = schedule.map((item) => {
          return item.id + item.date + item.text
        })

        let isDifferent = false

        for (let i = 0; i < currentMap.length; i++) {
          const item = currentMap[i]

          if (item !== writtenSchedule[i]) {
            isDifferent = true
            break
          }
        }

        if (!isDifferent) {
          return
        }
      }

      for (let i = 0; i < scheduleChannelIds.length; i++) {
        const channelInfo = scheduleChannelIds[i]

        if (updatedRegion) {
          const regions = Array.isArray(updatedRegion) ? updatedRegion : [updatedRegion]
          const hasMatchingRegion = regions.some((region) => channelInfo.regions.includes(region))

          if (!hasMatchingRegion) {
            // Skip regions that were not updated.
            continue
          }
        }

        const channel = client.channels.cache.get(channelInfo.id) as TextChannel | undefined

        if (!channel) {
          console.error(`--- ERROR: Channel not found to post sell-schedule ${channelInfo.regions.join('-')} ---`)
          continue
        }

        const messages = (await channel.messages.fetch()).filter((message) => message.author.id === client.user?.id)

        for (let j = 0; j < messages.size; j++) {
          const messageToDelete = messages.at(j)

          await messageToDelete?.delete().catch(() => {})
        }

        const regionSchedule = schedule.filter((message) => channelInfo.regions.includes(message.region))

        if (regionSchedule.length === 0) {
          await channel.send(NO_SELLS_COMMENTS[Math.round(Math.random() * (NO_SELLS_COMMENTS.length - 1))])
          continue
        }

        const result = getPrunedOutput(regionSchedule)

        const myScheduleButton = new ButtonBuilder()
          .setCustomId(`my-schedule-${channelInfo.regions.join('-')}`)
          .setLabel('My Schedule')
          .setStyle(ButtonStyle.Primary)

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(myScheduleButton)
        const lastRowPadding = '\n\u200B'

        for (let j = 0; j < result.length; j++) {
          const schedule = result[j]

          let padding = ''

          const isLastRow = j === result.length - 1

          if (isLastRow) {
            padding = lastRowPadding
          }

          await channel.send({
            content: schedule.join('\r\n\r\n') + padding,
            ...(isLastRow && { components: [row] }),
          })
        }
      }

      writtenSchedule = schedule.map((item) => {
        return item.id + item.date + item.text
      })
    }

    q.push(queueFunction)
  }

  function downloadIcs(interaction: StringSelectMenuInteraction) {
    const messages = interaction.values
      .map((id) => {
        return schedule.find((scheduleItem) => {
          return scheduleItem.id === id
        })
      })
      .filter((item) => !!item)

    const icsFile = generateIcs(messages)

    if (icsFile) {
      return interaction.reply({
        content: 'Here is your .ics file:',
        files: [icsFile],
        flags: MessageFlags.Ephemeral,
      })
    } else {
      return interaction.reply({
        content: 'Something went wrong generating the calendar data!',
        flags: MessageFlags.Ephemeral,
      })
    }
  }
}

function getPrunedOutput(history: ScheduleMessage[], addSubtext = false) {
  history.sort((a, b) => a.date - b.date)

  let hasReachedTextLimit = false

  const result = history.reduce<{ length: number; position: number; output: string[][] }>(
    (cum, message, index) => {
      if (hasReachedTextLimit) {
        return cum
      }

      if (cum.output.length - 1 < cum.position) {
        cum.output.push([])

        if (index !== 0) {
          const split = '-------------------------'
          cum.output[cum.position].push(split)
          cum.length += split.length
        }
      }

      // Message limit is 2000
      if (cum.length + message.text.length >= 1900) {
        if (addSubtext) {
          hasReachedTextLimit = true
          cum.output[cum.position].push(`⚠️ ${history.length - index} items not displayed ⚠️`)
        }

        cum.position++
        cum.length = 0

        return cum
      }

      cum.output[cum.position].push(message.text)

      return {
        length: cum.length + message.text.length,
        position: cum.position,
        output: cum.output,
      }
    },
    {
      length: 0,
      position: 0,
      output: [],
    },
  )

  return result.output
}

function getTimestampMatch(messageText: string) {
  // Regex to match the timestamp pattern <t:number:format>
  const pattern = /<t:(\d+):[a-zA-Z]>/
  return messageText.match(pattern)
}

function extractTimeText(match: RegExpMatchArray | null) {
  if (match) {
    // Extract the whole timestamp
    return match[0]
  } else {
    return '0'
  }
}

function extractTimestamp(match: RegExpMatchArray | null) {
  if (match) {
    // Extract the numeric part of the timestamp
    const timestamp = parseInt(match[1], 10)

    return timestamp
  } else {
    return 0
  }
}

function getSortedMessage(message: Message<boolean>, timeText: string) {
  const content = message.content
    .replaceAll('@everyone', '')
    .replaceAll('@', '')
    .replaceAll('  ', ' ')
    .replaceAll('\n\n', '\n')
    .replaceAll('\n', ' - ')
    .trim()

  // Sort the content message to have the time at the beginning
  if (timeText === '0') {
    // In case of weird input; do not manipulate text
    return content
  }

  const messageWithoutTime = content.replace(timeText, '')
  return timeText.trim() + ' ' + messageWithoutTime.trim() + ' ' + message.url
}

const NO_SELLS_COMMENTS = [
  'Loading History...',
  'No sells going, time to sign up as a hustler by PM-ing Dubious Detective!',
  'Nothing to see here, move along.',
  'Khajit has no wares because buyers have no coin.',
  'One small step for man, one empty sell list for mankind.',
  "The sell list is as empty as a goblin's heart.",
  "Silence in the marketplace... eerie, isn't it?",
  'No transactions today. The vault sleeps.',
  'All quiet on the selling front.',
  'Not a single sell in sight. Must be a holiday.',
  'No sells today, just tumbleweeds.',
  'The sell list is on vacation. Please check back later.',
  'Even the buyer took the day off.',
  "The market is as still as a dragon's lair.",
  'Zero sells. Time to sharpen your blades instead.',
  'The sell list is a blank canvas today.',
  'Nothing here. Did we miss a memo?',
  'No sells yet. Maybe you can change that?',
  "sup, i really liked the sells i joined with you, but you guys are just memeing too much in discord chats for my taste.\nsince i can't make the whole guild only use meme channel for memes you can kick me as im not fitting in\nfarewell whoever didnt meme and fuck you memers  -sh/severin/SeVeRiNhD.7195",
  "Team sorry for my past unreliable behaviour, I can see how I have triggered people with it and I can understand it, forgetting about a sell is tbh unacceptable (or just coming late and potentially causing us to lose buyers).\nFor what it's worth I've had quite a bit of irl stress but as an adult I should be capable of handling it and its not an excuse, just to explain.\nI've dealt with everything and I'm happy to show you the respect u deserve\n& I'm thankful that I still have the opportunity to raid here ❤️ best sell guild eu no cap\nsry for ping :monkapls:",
  "@ everyone (didn't wanna ping and annoy ppl) \nI was made aware, that i lacked performance during sells by not being correctly geared. Breaking rule 8a).\nI got a corresponding penalty.\nThis message is mostly to apologize to everyone for therefore griefing sells, it did not happen with malicious intend, but it happend. \nTherefor my sincere apology to everyone 🙇",
  "OwO Good luck on your exam!  You're gonna ace it!  I believe in you!  💖✨ \n\nRemember to stay calm and focused, and you'll do amazing!  Fighting!  💪💖",
  "You know what, Chase Chonker, I think it's time for a break from this.  I'm going to mute you.  I need to take a break from this.  I'm going to mute you.  I need to take a break from this.  You know what, Chase Chonker, I think it's time for a break from this.  I'm going to mute you.  I need to take a break from this.  I'm going to mute you.  I need to take a break from this. You know what, Chase Chonker,",
  'I AM SOwWY, SCHIZO. Aeon is the best, by the way. Did you know that a group of ravens is called an unkindness? 🥺 A cat meows! 🐱 A dog bawks! 🐶 A fwoag cwoaks! 🐸 A monkey chattews! 🐒 A pig oinks! 🐷  A goose honks! 🦆  A cow moos! 🐄 A lion woofs! 🦁',
]
