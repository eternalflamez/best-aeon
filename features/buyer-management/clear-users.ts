import { Client, Collection, TextChannel } from 'discord.js'
import cron from 'node-cron'

export default function automaticallyClearUsers(client: Client, guildId: string) {
  clearUsers(client, guildId)

  cron.schedule('0 17 * * *', async () => {
    try {
      await clearUsers(client, guildId)
    } catch (e: any) {
      console.error('[Error] Failed to clear users: ')
      console.error(e)
    }
  })
}

async function clearUsers(client: Client, guildId: string) {
  const riseChannels = client.channels.cache.filter((channel) => {
    if (
      channel instanceof TextChannel &&
      channel.guildId === guildId &&
      channel.parent?.name?.startsWith('Customers') &&
      channel.name.startsWith('🚩goodbye')
    ) {
      return true
    }

    return false
  }) as Collection<string, TextChannel>

  const days = 2
  let channelExpiredDate = new Date(new Date().getTime() - days * 24 * 60 * 60 * 1000)

  for (let i = 0; i < riseChannels.size; i++) {
    const channel = riseChannels.at(i)!

    if (!channel.lastMessageId) {
      continue
    }

    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve()
      }, 200)
    })

    let lastCreatedAt

    try {
      const lastMessage = await channel.messages.fetch(channel.lastMessageId)
      lastCreatedAt = lastMessage.createdAt
    } catch (e: any) {
      console.error('had to retry message get for channel: ', channel.name)

      const messages = await channel.messages.fetch({
        limit: 1,
      })

      if (!messages.size) {
        lastCreatedAt = channel.createdAt
      } else {
        lastCreatedAt = messages.at(0)!.createdAt
      }
    }

    if (channelExpiredDate <= lastCreatedAt) {
      continue
    }

    try {
      console.log(guildId, 'deleted channel:', channel.name)
      await channel.delete()
    } catch (e: any) {
      console.error('[Error] Failed to delete user channel due to ', e.message)
    }
  }
}
