import { Client } from 'discord.js'
import { config } from 'dotenv'
import cron from 'node-cron'
import leafDb from '../leaf-firestore.ts'

config()

export default async function (discordClient: Client) {
  console.log('Set up checking guild leavers for LEAF')

  checkForLeavers(discordClient)

  cron.schedule('0 * * * *', async () => {
    try {
      await checkForLeavers(discordClient)
    } catch (e: any) {
      console.error('[Error] Failed to load guild leavers: ')
      console.error(e)
    }
  })
}

async function checkForLeavers(client: Client) {
  const doc = await leafDb?.collection('util').doc('last-guild-event-id').get()

  if (!doc || !doc.exists) {
    return false
  }

  const lastId = doc.data()!.id

  const response = await fetch(`https://api.guildwars2.com/v2/guild/${process.env.LEAF_GUILD_ID}/log?since=${lastId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${process.env.LEAF_GUILD_BEARER}`,
    },
  })

  if (!response.ok) {
    console.log(`Error fetching guild info - ${response.status}`)
    return
  }

  const eventData = (await response.json()) as EventLog[]

  if (eventData.length === 0) {
    return
  }

  const filteredData = eventData.filter((event) => event.type === 'kick' && event.user === event.kicked_by)

  if (filteredData.length) {
    const owner = await client.guilds.cache.get(process.env.LEAF_DISCORD_GUILD_ID!)?.fetchOwner()

    const userList = filteredData.map((event) => event.user)

    console.log(`Users who left: ${userList.join(', ')}`)

    if (!owner) {
      console.log('Missing owner?')
      return
    }

    await owner.send(
      `${userList.length === 0 ? 'Someone' : 'Some people'} left the ingame guild: ${userList.join(', ')}`,
    )
  }

  await leafDb?.collection('util').doc('last-guild-event-id').update({
    id: eventData[0].id,
  })
}
