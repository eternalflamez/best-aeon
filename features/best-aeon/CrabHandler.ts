import { Message } from 'discord.js'
import { MessageHandler } from '../../types/MessageHandler'

export default class CrabHandler implements MessageHandler {
  async handle(message: Message) {
    const content = message.content.toLowerCase()

    if (content.includes('crab') || content.includes('🦀')) {
      await message.react('🦀')
    }

    return false
  }
}
