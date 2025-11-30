import { ChannelType, Client, Message } from 'discord.js'
import { MessageHandler } from '../../types/MessageHandler.ts'

export default class DmHandler implements MessageHandler {
  #client: Client

  constructor(client: Client) {
    this.#client = client
  }

  async handle(message: Message) {
    if (message.channel.type === ChannelType.DM) {
      console.log(
        `${this.#client.user?.displayName} Received DM from: ${message.author.displayName}; ${message.content}`,
      )
    }

    return false
  }
}
