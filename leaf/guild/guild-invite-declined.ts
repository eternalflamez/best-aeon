import { Client } from 'discord.js'
import { sendEmbedToChannel } from './guild-events'
import { COLORS } from '../constants/colors'

export async function checkGuildInviteDeclined(client: Client, eventData: EventLog[]) {
  const filteredData = eventData.filter((event) => event.type === 'invite_declined')

  if (!filteredData.length) {
    return
  }

  for (let i = 0; i < filteredData.length; i++) {
    const event = filteredData[i]

    let title

    if (event.declined_by) {
      title = `<:leaf:1063787211365036093> The guild invite for user ${event.user} was cancelled by ${event.declined_by}!`
    } else {
      title = `<:leaf:1063787211365036093> The guild invite for user ${event.user} was declined!`
    }

    await sendEmbedToChannel(client, {
      embeds: [
        {
          color: COLORS.negative,
          timestamp: event.time,
          title,
        },
      ],
    })
  }
}
