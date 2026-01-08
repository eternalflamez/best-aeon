import { Client } from 'discord.js'
import { sendEmbedToChannel } from './guild-events'
import { COLORS } from '../constants/colors'

export async function checkGuildJoined(client: Client, eventData: EventLog[]) {
  const filteredData = eventData.filter((event) => event.type === 'joined')

  if (!filteredData.length) {
    return
  }

  for (let i = 0; i < filteredData.length; i++) {
    const event = filteredData[i]

    await sendEmbedToChannel(client, {
      embeds: [
        {
          color: COLORS.positive,
          title: `<:leaf:1063787211365036093> ${event.user} has joined the guild!`,
          timestamp: event.time,
        },
      ],
    })
  }
}
