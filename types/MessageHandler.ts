import { Message } from 'discord.js'

export interface MessageHandler {
  handle(message: Message): Promise<boolean>
}
