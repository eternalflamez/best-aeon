import { userMention } from 'discord.js'
import helloIAm from './utility/helloIAm.js'

const exclusions = ['332175471598895105']

export default async function (client, message) {
  if (exclusions.includes(message.author.id)) {
    return true
  }

  const iAm = helloIAm(
    message.content.replace(/<@!?(\d+)>/g, userMention(message.author.id)),
    userMention(client.user.id),
  )

  if (iAm && Math.random() < 0.1) {
    await message.channel.send(iAm)
    return true
  }
}
