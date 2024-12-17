import { Client, Message, userMention } from 'discord.js'
import helloIAm from './utility/helloIAm.ts'
import { logIAm } from '../firestore/log.ts'

export default async function (client: Client, message: Message) {
  const iAm = helloIAm(message.content, userMention(client.user!.id), message.author.id)

  if (iAm && Math.random() < 0.1) {
    logIAm(message.author.id, iAm.clip)

    await message.reply(iAm.output)
    return true
  }
}
