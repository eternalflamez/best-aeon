import { userMention, Message, ThreadAutoArchiveDuration } from 'discord.js'
// @ts-ignore
import sellChannels from '../constants/sellChannels.js'

export default async function (messageText: string, message: Message<boolean>) {
  if (sellChannels[message.channelId]) {
    if (messageText.includes('<t:')) {
      const limit = 100
      const timestampPattern = /<t:\d+:[a-zA-Z]>/g
      let name = message.content.split('\n')[0].replace(timestampPattern, '').replace('@everyone', '').trim()

      if (name.length > limit) {
        name = name.slice(0, 97) + '...'
      }

      console.log('Creating a thread:', name)

      try {
        if (name) {
          const thread = await message.startThread({
            name,
            autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
          })

          const wrongTitle = name.match(/\btitel\b/i)

          if (wrongTitle) {
            await thread.send(`${userMention(message.author.id)}, it's title, not titel.`)
          }
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
}
