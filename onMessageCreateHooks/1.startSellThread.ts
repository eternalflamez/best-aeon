import { userMention, Message, ThreadAutoArchiveDuration } from 'discord.js'
// @ts-ignore
import sellChannels from '../constants/sellChannels.js'

export default async function (messageText: string, message: Message<boolean>) {
  if (sellChannels[message.channelId]) {
    if (messageText.includes('<t:')) {
      const timestampPattern = /<t:\d+:[a-zA-Z]>/g
      const name = message.content.split('\n')[0].replace(timestampPattern, '').replace('@everyone', '').trim()

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

        thread.send(
          `${userMention(message.author.id)}, please put the thread title on first line of sell post, now you gotta edit the title yourself.`,
        )
      }
    }

    return true
  }
}