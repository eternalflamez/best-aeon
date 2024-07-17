import sellChannels from '../constants/sellChannels.js'

export default async function (reaction, user) {
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
      await user.fetch()
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
    await thread.members.fetch()
    const isMember = thread.members.cache.has(user.id)

    if (!isMember) {
      await thread.members.add(user)
      console.log('added', user.displayName, 'to a thread')
    }
  } catch (error) {
    console.error('Error checking thread membership:', error)
    console.warn(e.message)
  }
}
