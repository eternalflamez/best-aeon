import { Client, MessageCreateOptions, MessagePayload, TextChannel } from 'discord.js'
import { config } from 'dotenv'
import cron from 'node-cron'
import leafDb from '../leaf-firestore.ts'
import { checkGuildLeavers } from './guild-leave.ts'
import { checkGuildStashInteracts } from './guild-stash-interact.ts'
import { checkGuildMessageOfTheDay } from './guild-motd.ts'
import { checkGuildInviteDeclined } from './guild-invite-declined.ts'
import { checkGuildInvited } from './guild-invited.ts'
import { checkGuildJoined } from './guild-joined.ts'
import { checkGuildMissionStatus } from './guild-mission.ts'
import { checkGuildRankChange } from './guild-rank-change.ts'
import { checkUserNameChange } from './guild-name-change.ts'

config()

export default async function (discordClient: Client) {
  console.log('Seting up guild events for LEAF')

  const guild = discordClient.guilds.cache.get(process.env.LEAF_DISCORD_GUILD_ID!)!
  await guild.members.fetch()

  await loadEvents(discordClient)
  await checkUserNameChange(discordClient)

  cron.schedule('*/5 * * * *', async () => {
    try {
      await loadEvents(discordClient)
    } catch (e: any) {
      console.error('[Error] Failed to load guild data: ')
      console.error(e)
    }
  })

  cron.schedule('0 20 * * *', async () => {
    try {
      await checkUserNameChange(discordClient)
    } catch (e: any) {
      console.error('[Error] Failed to load guild member data: ')
      console.error(e)
    }
  })
}

async function loadEvents(client: Client) {
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

  let eventData = (await response.json()) as EventLog[]

  if (eventData.length === 0) {
    return
  }

  eventData = eventData.sort((a, b) => {
    if (a.id < b.id) {
      return -1
    }

    if (a.id > b.id) {
      return 1
    }

    return 0
  })

  await checkGuildInviteDeclined(client, eventData)
  await checkGuildInvited(client, eventData)
  await checkGuildJoined(client, eventData)
  await checkGuildLeavers(client, eventData)
  await checkGuildRankChange(client, eventData)
  await checkGuildMissionStatus(client, eventData)
  await checkGuildStashInteracts(client, eventData)
  await checkGuildMessageOfTheDay(client, eventData)

  await leafDb
    ?.collection('util')
    .doc('last-guild-event-id')
    .update({
      id: eventData[eventData.length - 1].id,
    })
}

export async function sendEmbedToChannel(client: Client, message: string | MessagePayload | MessageCreateOptions) {
  let channel

  try {
    channel = await client.channels.fetch(process.env.LEAF_DISCORD_CHANNEL!)
  } catch {
    console.log('No access to the events channel!')
  }

  if (!channel || !(channel instanceof TextChannel)) {
    return
  }

  await channel.send(message)
}
