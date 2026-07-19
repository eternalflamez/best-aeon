import { Client, Message, PermissionFlagsBits, TextChannel, userMention } from 'discord.js'
import replyTo from './utility/gemini.ts'
import timeoutReactions from '../../constants/timeoutReactions.ts'
import { logGemini } from '../../firestore/log.ts'
import { MessageHandler } from '../../types/MessageHandler.ts'

export default class HerbertHandler implements MessageHandler {
  #client: Client
  #timeoutReactionsLength = timeoutReactions.length
  #lastCallByUser = new Map<string, number>()

  constructor(client: Client) {
    this.#client = client
  }

  async handle(message: Message) {
    if (!message.mentions.has(this.#client.user!.id)) {
      return false
    }

    const now = Date.now()
    const lastCall = this.#lastCallByUser.get(message.author.id) ?? 0

    if (now - lastCall < 5000) {
      const reactions = timeoutReactions[Math.round(Math.random() * (this.#timeoutReactionsLength - 1))]

      await this.#sendReply(message, reactions)

      logGemini(message.author.id, message.author.username, '', 'cooldown')
      return true
    }

    const canSend =
      !message.inGuild() ||
      message.guild.members.me?.permissionsIn(message.channelId).has(PermissionFlagsBits.SendMessages)

    if (!canSend) {
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

    let aiMessage = `${message.member?.displayName}[${new Date().toUTCString()}]: ${filteredMessage}`

    if (message.reference) {
      try {
        const repliedTo = await message.fetchReference()
        let repliedContent = repliedTo.content

        repliedTo.mentions.members?.each((member) => {
          repliedContent = repliedContent.replaceAll(userMention(member.id), member.displayName || '')
        })

        const repliedDisplayName = repliedTo.member?.displayName ?? repliedTo.author.displayName
        aiMessage = `[Replying to: ${repliedDisplayName}[${repliedTo.createdAt.toUTCString()}]: ${repliedContent}]\n${aiMessage}`
      } catch {
        aiMessage = `[Replying to a message that could not be loaded]\n${aiMessage}`
      }
    }

    try {
      this.#lastCallByUser.set(message.author.id, now)

      let reply = await replyTo(message.channelId, aiMessage, images)

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
      console.error('gemini handler error')
      console.error(e)

      let reply = 'Sorry I was too stupid to cook up a reply and instead had an error.'

      if (e.message.includes('current quota')) {
        reply = '[QUOTA_EXCEEDED]'
      }

      if (e.message.includes('high demand')) {
        reply = '[HIGH_DEMAND]'
      }

      logGemini(message.author.id, message.author.username, reply, 'error')

      await this.#sendReply(message, reply)
    }

    return true
  }

  #sendReply(message: Message, reply: string) {
    return message.reply(reply.trim())
  }
}
