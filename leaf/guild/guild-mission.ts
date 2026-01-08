import { Client } from 'discord.js'
import { sendEmbedToChannel } from './guild-events'
import { COLORS } from '../constants/colors'

export async function checkGuildMissionStatus(client: Client, eventData: EventLog[]) {
  const filteredData = eventData.filter((event) => event.type === 'mission')

  if (!filteredData.length) {
    return
  }

  for (let i = 0; i < filteredData.length; i++) {
    const event = filteredData[i]

    let title

    if (event.state === 'start') {
      title = `<:leaf_helper:1433816388497309696> ${event.user} started a guild mission!`
    } else if (event.state === 'success') {
      title = '<:leaf_helper:1433816388497309696> A guild mission has finished successfully!'
    } else {
      title = '<:leaf_helper:1433816388497309696> A guild mission has failed!'
    }

    await sendEmbedToChannel(client, {
      embeds: [
        {
          color: COLORS.positive,
          timestamp: event.time,
          title,
        },
      ],
    })
  }
}
