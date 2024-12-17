import { Client, Message, userMention } from 'discord.js'
import helloIAm from './utility/helloIAm.ts'

export default async function (client: Client, message: Message) {
  const iAm = helloIAm(message.content, userMention(client.user!.id), message.author.id)

  if (iAm && Math.random() < 0.1) {
    await message.reply(iAm)
    return true
  }
}
