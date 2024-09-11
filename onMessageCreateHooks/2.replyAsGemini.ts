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

      await message.channel.send(reactions)
      return true
    }

    let filteredMessage = message.content.replace(userMention(client.user!.id), '')

    message.mentions.users.each((user) => {
      filteredMessage = filteredMessage.replace(userMention(user.id), user.globalName || '')
    })

    try {
      lastGeminiCallTime = now

      let reply = await replyTo(message.channelId, filteredMessage)

      reply = reply.replace('@', '[at]')

      if (reply) {
        await message.channel.send(reply)
      } else {
        await message.channel.send('Sorry I was too stupid too cook up a reply and instead generated nothing.')
      }
    } catch (e: any) {
      if (e.rawError?.message === 'Missing Permissions') {
        return true
      }

      console.error(e)
      await message.channel.send('Sorry I was too stupid too cook up a reply and instead had an error.')
    }

    return true
  }
}
