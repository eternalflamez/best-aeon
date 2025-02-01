import { Client, Message, userMention } from 'discord.js'
import helloIAm from './utility/helloIAm.ts'
import { logIAm } from '../../firestore/log.ts'
import { MessageHandler } from '../../types/MessageHandler.ts'

export default class HelloIAmHandler implements MessageHandler {
  #client: Client

  constructor(client: Client) {
    this.#client = client
  }

  async handle(message: Message) {
    const exclusions = ['332175471598895105']

    if (exclusions.includes(message.author.id)) {
      return true
    }

    const iAm = helloIAm(message.content, userMention(this.#client.user!.id), message.author.id)

    if (iAm && Math.random() < 0.1) {
      logIAm(message.author.id, iAm.clip)

      await message.reply(iAm.output)
      return true
    }

    return false
  }
}
