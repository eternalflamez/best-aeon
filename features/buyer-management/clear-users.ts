import { Client, Collection, TextChannel } from 'discord.js'
import cron from 'node-cron'
import { config } from 'dotenv'
config()

export default function automaticallyClearUsers(client: Client, guildId: string) {
  cron.schedule('0 2 * * *', () => {
    try {
      clearUsers(client, guildId)
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
      channel.parent?.name?.startsWith('gamers-only')
    ) {
      return true
    }

    return false
  }) as Collection<string, TextChannel>

  let twoWeeksAgo = new Date(new Date().getTime() - 14 * 24 * 60 * 60 * 1000)

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

    const shouldYeet = twoWeeksAgo > lastCreatedAt

    const userId = channel.topic?.split(' ').shift()

    if (userId) {
      let member

      try {
        member = await channel.guild.members.fetch(userId)
      } catch {
        console.log(guildId, 'deleted memberless channel:', channel.name)
        channel.delete()
        continue
      }

      if (!shouldYeet) {
        continue
      }

      if (member.roles.cache.size === 1) {
        const user = await client.users.fetch(userId)

        console.log(guildId, 'kicked:', channel.name, `https://discord.gg/${process.env['INVITE_' + guildId]}`)

        await user.send(String.raw`Greetings, I am a bot. Messages sent to me are not read by real people.
We noticed you have been inactive on our discord, so you have been kicked.

Not to worry, if you want to buy anything or browse our prices again, feel free to rejoin:
https://discord.gg/${process.env['INVITE_' + guildId]}`)

        try {
          await member.kick()
        } catch (e: any) {
          console.error('[Error] Failed to kick user due to ', e.message)
        }

        await new Promise<void>((resolve) => {
          setTimeout(() => {
            resolve()
          }, 200)
        })
      }

      try {
        await channel.delete()
      } catch (e: any) {
        console.error('[Error] Failed to delete user channel due to ', e.message)
      }
    }
  }
}
