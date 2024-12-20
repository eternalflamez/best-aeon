import { Client, Message, userMention } from 'discord.js'
import replyTo from './utility/gemini.js'
import timeoutReactions from '../constants/timeoutReactions.ts'
import { logGemini } from '../firestore/log.ts'

const timeoutReactionsLength = timeoutReactions.length

let lastGeminiCallTime = 0

const bans = ['']

export default async function (client: Client, message: Message) {
  if (bans.includes(message.author.id)) {
    return false
  }

  if (message.mentions.has(client.user!.id)) {
    const now = Date.now()

    if (now - lastGeminiCallTime < 5000) {
      const reactions = timeoutReactions[Math.round(Math.random() * (timeoutReactionsLength - 1))]

      await message.reply(reactions)

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

        await message.reply(reply)
      } else {
        console.error('No message generated for gemini')

        reply = 'Sorry I was too stupid to cook up a reply and instead generated nothing.'

        logGemini(message.author.id, message.author.username, reply, 'error')

        await message.reply(reply)
      }
    } catch (e: any) {
      console.error(e.message)

      const reply = 'Sorry I was too stupid to cook up a reply and instead had an error.'

      logGemini(message.author.id, message.author.username, reply, 'error')

      await message.reply(reply)
    }

    return true
  }
}
