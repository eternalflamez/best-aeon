import { Client, Message, userMention } from 'discord.js'
import helloIAm from './utility/helloIAm.ts'

const exclusions = ['332175471598895105']

export default async function (client: Client, message: Message) {
  if (exclusions.includes(message.author.id)) {
    return true
  }

  const iAm = helloIAm(
    message.content.replace(/<@!?(\d+)>/g, userMention(message.author.id)),
    userMention(client.user!.id),
  )

  if (iAm && Math.random() < 0.1) {
    await message.reply(iAm)
    return true
  }
}
