import { Client, userMention } from 'discord.js'
import { config } from 'dotenv'
import { sendEmbedToChannel } from './guild-events'
import { COLORS } from '../constants/colors'

config()

export async function checkGuildLeavers(client: Client, eventData: EventLog[]) {
  const filteredData = eventData.filter((event) => event.type === 'kick') as KickEventLog[]

  if (!filteredData.length) {
    return
  }

  const owner = await client.guilds.cache.get(process.env.LEAF_DISCORD_GUILD_ID!)?.fetchOwner()
  const members = client.guilds.cache.get(process.env.LEAF_DISCORD_GUILD_ID!)!.members.cache

  const userList = filteredData.filter((log) => log.kicked_by === log.user).map((event) => event.user)

  for (let i = 0; i < filteredData.length; i++) {
    const event = filteredData[i]
    const member = members.find((m) => m.displayName.includes(event.user))
    let descriptionSuffix = member
      ? `Their name matches ${userMention(member.id)}`
      : 'No matching discord user available.'

    if (event.user === event.kicked_by) {
      await sendEmbedToChannel(client, {
        embeds: [
          {
            color: COLORS.negative,
            title: '⚠️ A user left!',
            description: `User \`${event.user}\` has left the guild. ${descriptionSuffix}`,
            timestamp: event.time,
          },
        ],
      })
    } else {
      await sendEmbedToChannel(client, {
        embeds: [
          {
            color: COLORS.negative,
            title: '⚠️ A user was kicked!',
            description: `User \`${event.user}\` was kicked by ${event.kicked_by}. ${descriptionSuffix}`,
            timestamp: event.time,
          },
        ],
      })
    }

    if (userList.length > 0) {
      if (!owner) {
        console.error('Missing owner')
        return
      }

      await owner.send(
        `${userList.length === 1 ? 'Someone' : 'Some people'} left the ingame guild: ${userList.join(', ')}`,
      )
    }
  }
}
