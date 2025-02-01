import { userMention, Message, ThreadAutoArchiveDuration } from 'discord.js'
import { isInstantChannel, isValidSellChannel } from '../../constants/sellChannels.ts'
import { logStartSellThread } from '../../firestore/log.ts'
import { MessageHandler } from '../../types/MessageHandler.js'

export default class StartSellThreadHandler implements MessageHandler {
  async handle(message: Message<boolean>) {
    const messageText = message.content.toLowerCase()

    if (isValidSellChannel(message.channelId)) {
      const isPingInInstantChannel = isInstantChannel(message.channelId) && messageText.includes('@everyone')

      if (messageText.includes('<t:') || isPingInInstantChannel) {
        const limit = 100
        const timestampPattern = /<t:\d+:[a-zA-Z]>/g
        let name = message.content.split('\n')[0].replace(timestampPattern, '').replace('@everyone', '').trim()

        if (name.length > limit) {
          name = name.slice(0, 97) + '...'
        }

        console.log('Creating a thread:', name)

        logStartSellThread(message.author.id, message.author.username)

        try {
          if (name) {
            await message.startThread({
              name,
              autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
            })
          } else {
            const thread = await message.startThread({
              name: 'Please put the thread title on first line of sell post',
              autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
            })

            await thread.send(
              `${userMention(message.author.id)}, please put the thread title on first line of sell post, now you gotta edit the title yourself.`,
            )
          }
        } catch (e: any) {
          console.error('Failed to create thread:', name, 'Reason: ', e.rawError?.message)
        }
      }

      return true
    }

    return false
  }
}
