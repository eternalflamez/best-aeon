import { Client, Message, userMention } from 'discord.js'
import replyTo from './utility/gemini.js'
import timeoutReactions from '../constants/timeoutReactions.ts'

const timeoutReactionsLength = timeoutReactions.length

let lastGeminiCallTime = 0

export default async function (client: Client, message: Message) {
  if (message.mentions.has(client.user!.id)) {
    const now = Date.now()

    if (now - lastGeminiCallTime < 5000) {
      const reactions = timeoutReactions[Math.round(Math.random() * timeoutReactionsLength)]

      await message.reply(reactions)
      return true
    }

    let filteredMessage = message.content.replace(userMention(client.user!.id), '')

    message.mentions.users.each((user) => {
      filteredMessage = filteredMessage.replace(userMention(user.id), user.globalName || '')
    })

    try {
      lastGeminiCallTime = now

      let reply = await replyTo(
        message.channelId,
        `${message.member?.displayName}[${new Date().toUTCString()}]: ${filteredMessage}`,
      )

      reply = reply.replace('@', '[at]')

      if (reply) {
        await message.reply(reply)
      } else {
        console.error('No message generated for gemini')
        await message.reply('Sorry I was too stupid too cook up a reply and instead generated nothing.')
      }
    } catch (e: any) {
      console.error(e.message)

      await message.reply('Sorry I was too stupid too cook up a reply and instead had an error.')
    }

    return true
  }
}
