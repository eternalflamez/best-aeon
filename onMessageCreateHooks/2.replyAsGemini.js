import { userMention } from 'discord.js'
import replyTo from './utility/gemini.js'
import timeoutReactions from '../constants/timeoutReactions.js'

const timeoutReactionsLength = timeoutReactions.length

let lastGeminiCallTime = 0

export default async function (client, message) {
  if (message.mentions.has(client.user.id)) {
    const now = Date.now()

    if (now - lastGeminiCallTime < 5000) {
      const reactions = timeoutReactions[Math.round(Math.random() * timeoutReactionsLength)]

      await message.channel.send(reactions)
      return true
    }

    let filteredMessage = message.content.replace(userMention(client.user.id), '')

    message.mentions.users.each((user) => {
      filteredMessage = filteredMessage.replace(userMention(user.id), user.globalName)
    })

    try {
      if (Math.random < 0.01) {
        filteredMessage =
          "Yell MAAAAAAAAAAAAAAAAAAAAAAAX for me with an amount of A's between 20 and 30. Reply with nothing other than the yell."
      }

      lastGeminiCallTime = now

      let reply = await replyTo(filteredMessage)

      reply = reply.replace('@', '')

      if (reply) {
        await message.channel.send(reply)
      } else {
        await message.channel.send('Sorry I was too stupid too cook up a reply and instead generated nothing.')
      }
    } catch (e) {
      if (e.rawError?.message === 'Missing Permissions') {
        return true
      }

      console.error(e)
      await message.channel.send('Sorry I was too stupid too cook up a reply and instead had an error.')
    }

    return true
  }
}
