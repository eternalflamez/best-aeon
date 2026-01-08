import { Client } from 'discord.js'
import { sendEmbedToChannel } from './guild-events'
import { COLORS } from '../constants/colors'

export async function checkGuildInvited(client: Client, eventData: EventLog[]) {
  const filteredData = eventData.filter((event) => event.type === 'invited')

  if (!filteredData.length) {
    return
  }

  for (let i = 0; i < filteredData.length; i++) {
    const event = filteredData[i]

    await sendEmbedToChannel(client, {
      embeds: [
        {
          color: COLORS.positive,
          title: `<:leaf:1063787211365036093> ${event.user} was invited to the guild by ${event.invited_by}!`,
          timestamp: event.time,
        },
      ],
    })
  }
}
