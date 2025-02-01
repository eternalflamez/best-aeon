import { Message, TextChannel, userMention } from 'discord.js'
import { MessageHandler } from '../../types/MessageHandler.ts'

export default class WhatsDnHandler implements MessageHandler {
  async handle(message: Message) {
    const messageText = message.content.toLowerCase()

    if (/\bdn\b/i.test(messageText)) {
      await (message.channel as TextChannel).send(`${userMention(message.author.id)} What\s dn?`)
      return true
    }

    return false
  }
}
