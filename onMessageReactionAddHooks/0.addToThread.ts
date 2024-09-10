import { MessageReaction, PartialMessageReaction, PartialUser, User } from 'discord.js'
// @ts-ignore
import sellChannels from '../constants/sellChannels.js'

export default async function (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) {
  if (reaction.partial) {
    try {
      await reaction.fetch()
    } catch (error) {
      console.error('Something went wrong when fetching the message:', error)
      return
    }
  }

  if (!sellChannels[reaction.message.channelId]) {
    return
  }

  if (user.partial) {
    try {
      user = await user.fetch()
    } catch (error) {
      console.error('Something went wrong when fetching the user:', error)
      return
    }
  }

  if (!reaction.message.hasThread) {
    return
  }

  const thread = reaction.message.thread

  try {
    if (!thread) {
      console.error(
        `Error checking thread membership: Thread does not exist for ${reaction.message.content?.slice(0, 50)}`,
      )
      return
    }

    await thread.members.fetch()
    const isMember = thread.members.cache.has(user.id)

    if (!isMember) {
      await thread.members.add(user)
      console.log(`Added ${user.displayName} to ${thread.name}`)
    }
  } catch (error) {
    console.error('Error checking thread membership:', error)
  }
}
