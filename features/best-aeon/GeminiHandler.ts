import { Client, Message, TextChannel, userMention } from 'discord.js'
import replyTo from './utility/gemini.ts'
import timeoutReactions from '../../constants/timeoutReactions.ts'
import { logGemini } from '../../firestore/log.ts'
import { MessageHandler } from '../../types/MessageHandler.ts'

export default class GeminiHandler implements MessageHandler {
  #client: Client
  #timeoutReactionsLength = timeoutReactions.length
  #lastGeminiCallTime = 0

  constructor(client: Client) {
    this.#client = client
  }

  async handle(message: Message) {
    if (!message.mentions.has(this.#client.user!.id)) {
      return false
    }

    const now = Date.now()

    if (now - this.#lastGeminiCallTime < 5000) {
      const reactions = timeoutReactions[Math.round(Math.random() * (this.#timeoutReactionsLength - 1))]

      await this.#sendReply(message, reactions)

      logGemini(message.author.id, message.author.username, '', 'cooldown')
      return true
    }

    await (message.channel as TextChannel).sendTyping()

    let filteredMessage = message.content
    const images: { data: Uint8Array; mimeType: string }[] = []

    for (const attachment of message.attachments.values()) {
      if (
        attachment.contentType &&
        ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'].includes(attachment.contentType)
      ) {
        try {
          const response = await fetch(attachment.url)
          const arrayBuffer = await response.arrayBuffer()
          images.push({
            data: new Uint8Array(arrayBuffer),
            mimeType: attachment.contentType,
          })
        } catch (error) {
          console.error('Failed to fetch image:', error)
        }
      }
    }

    message.mentions.members?.each(async (member) => {
      filteredMessage = filteredMessage.replaceAll(userMention(member.id), member.displayName || '')
    })

    try {
      this.#lastGeminiCallTime = now

      let reply = await replyTo(
        message.channelId,
        `${message.member?.displayName}[${new Date().toUTCString()}]: ${filteredMessage}`,
        images,
      )

      reply = reply.replaceAll('@', '[at]')

      if (reply) {
        logGemini(message.author.id, message.author.username, reply, 'response')

        await this.#sendReply(message, reply)
      } else {
        console.error('No message generated for gemini')

        reply = 'Sorry I was too stupid to cook up a reply and instead generated nothing.'

        logGemini(message.author.id, message.author.username, reply, 'error')

        await this.#sendReply(message, reply)
      }
    } catch (e: any) {
      console.error(e.message)

      const reply = 'Sorry I was too stupid to cook up a reply and instead had an error.'

      logGemini(message.author.id, message.author.username, reply, 'error')

      await this.#sendReply(message, reply)
    }

    return true
  }

  #sendReply(message: Message, reply: string) {
    return message.reply(reply.trim())
  }
}
