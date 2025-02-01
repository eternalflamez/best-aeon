import { Message, TextChannel } from 'discord.js'
import { MessageHandler } from '../../types/MessageHandler.ts'

export default class BestAeonHandler implements MessageHandler {
  async handle(message: Message) {
    if (message.stickers.hasAny('1199452550198460416')) {
      await (message.channel as TextChannel).send(`Best AEON!`)
      return true
    }

    return false
  }
}
