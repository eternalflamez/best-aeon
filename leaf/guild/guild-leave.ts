import { Client, userMention } from 'discord.js'
import { config } from 'dotenv'
import { sendEmbedToChannel } from './guild-events'

config()

export default async function (client: Client, eventData: EventLog[]) {
  const filteredData = eventData.filter((event) => event.type === 'kick') as KickEventLog[]

  if (filteredData.length) {
    const owner = await client.guilds.cache.get(process.env.LEAF_DISCORD_GUILD_ID!)?.fetchOwner()
    const members = client.guilds.cache.get(process.env.LEAF_DISCORD_GUILD_ID!)!.members.cache

    const userList = filteredData.map((event) => event.user)

    for (let i = 0; i < filteredData.length; i++) {
      const event = filteredData[i]
      const member = members.find((m) => m.displayName.includes(event.user))
      let descriptionSuffix = member ? `Their name matches ${userMention(member.id)}` : ''

      if (event.user === event.kicked_by) {
        await sendEmbedToChannel(client, {
          embeds: [
            {
              color: 0xd50000,
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
              color: 0x6200ea,
              title: '⚠️ A user was kicked!',
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

    await owner.send(
      `${userList.length === 0 ? 'Someone' : 'Some people'} left the ingame guild: ${userList.join(', ')}`,
    )
  }
}
