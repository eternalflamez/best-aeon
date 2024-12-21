import { Client, Message, userMention } from 'discord.js'
import replyTo from './utility/gemini.js'
import timeoutReactions from '../constants/timeoutReactions.ts'
import { logGemini } from '../firestore/log.ts'

const timeoutReactionsLength = timeoutReactions.length

let lastGeminiCallTime = 0

const bannedUser = '219560133271748608'
let banTimestamp = 0
let count = 0

async function handleBan(message: Message) {
  if (message.author.id === bannedUser) {
    if (banTimestamp) {
      if (new Date(banTimestamp).toDateString() === new Date().toDateString()) {
        return true
      } else {
        banTimestamp = 0
        count = 0
      }
    }

    if (Math.random() < 1 / 15) {
      banTimestamp = Date.now()

      await sendReply(
        message,
        `I'm going to block you. Please get help, ${message.author.displayName}. I hope you get help. I'm going to end this conversation. You're blocked.`,
      )

      return true
    }
  }

  return false
}

export default async function (client: Client, message: Message) {
  if (await handleBan(message)) {
    return true
  }

  if (message.mentions.has(client.user!.id)) {
    const now = Date.now()

    if (now - lastGeminiCallTime < 5000) {
      const reactions = timeoutReactions[Math.round(Math.random() * (timeoutReactionsLength - 1))]

      await sendReply(message, reactions)

      logGemini(message.author.id, message.author.username, '', 'cooldown')
      return true
    }

    let filteredMessage = message.content.replace(userMention(client.user!.id), client.user!.displayName)

    message.mentions.users.each((user) => {
      filteredMessage = filteredMessage.replace(userMention(user.id), user.displayName || '')
    })

    try {
      lastGeminiCallTime = now

      let reply = await replyTo(
        message.channelId,
        `${message.member?.displayName}[${new Date().toUTCString()}]: ${filteredMessage}`,
      )

      reply = reply.replace('@', '[at]')

      if (reply) {
        logGemini(message.author.id, message.author.username, reply, 'response')

        await sendReply(message, reply)
      } else {
        console.error('No message generated for gemini')

        reply = 'Sorry I was too stupid to cook up a reply and instead generated nothing.'

        logGemini(message.author.id, message.author.username, reply, 'error')

        await sendReply(message, reply)
      }
    } catch (e: any) {
      console.error(e.message)

      const reply = 'Sorry I was too stupid to cook up a reply and instead had an error.'

      logGemini(message.author.id, message.author.username, reply, 'error')

      await sendReply(message, reply)
    }

    return true
  }
}

function sendReply(message: Message, reply: string) {
  reply = reply.trim()

  if (message.author.id === bannedUser) {
    reply += `\r\n(${++count}/20)`
  }

  return message.reply(reply)
}
