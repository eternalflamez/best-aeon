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

  const leavers = filteredData.filter((log) => log.kicked_by === log.user).map((event) => event.user)
  const kicked = filteredData.filter((log) => log.kicked_by !== log.user)

  for (const event of filteredData) {
    const member = members.find((m) => m.displayName.includes(event.user))
    const descriptionSuffix = member
      ? `Their name matches ${userMention(member.id)}`
      : 'No matching discord user available.'

    if (event.user === event.kicked_by) {
      await sendEmbedToChannel(client, {
        embeds: [
          {
            color: COLORS.negative,
            title: '⚠️ A user left the in-game guild!',
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
            title: '⚠️ A user was kicked from the in-game guild!',
            description: `User \`${event.user}\` was kicked by ${event.kicked_by}. ${descriptionSuffix}`,
            timestamp: event.time,
          },
        ],
      })
    }
  }

  if (!owner) {
    console.error('Missing owner')
    return
  }

  if (leavers.length > 0) {
    await owner.send(
      `${leavers.length === 1 ? 'Someone' : 'Some people'} left the ingame guild: ${leavers.join(', ')}`,
    )
  }

  if (kicked.length > 0) {
    const kickedSummary = kicked.map((event) => `\`${event.user}\` (by ${event.kicked_by})`).join(', ')
    await owner.send(
      `${kicked.length === 1 ? 'Someone was' : 'Some people were'} kicked from the ingame guild: ${kickedSummary}`,
    )
  }
}
