import { Client, Message, userMention } from 'discord.js'
import helloIAm from './utility/helloIAm.ts'
import { logIAm } from '../firestore/log.ts'

const exclusions = ['332175471598895105']

export default async function (client: Client, message: Message) {
  if (exclusions.includes(message.author.id)) {
    return true
  }

  const iAm = helloIAm(message.content, userMention(client.user!.id), message.author.id)

  if (iAm && Math.random() < 0.1) {
    logIAm(message.author.id, iAm.clip)

    await message.reply(iAm.output)
    return true
  }
}
