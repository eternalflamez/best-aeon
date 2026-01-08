import { Client } from 'discord.js'
import { sendEmbedToChannel } from './guild-events'
import { COLORS } from '../constants/colors'

export async function checkGuildRankChange(client: Client, eventData: EventLog[]) {
  const filteredData = eventData.filter((event) => event.type === 'rank_change')

  if (!filteredData.length) {
    return
  }

  for (let i = 0; i < filteredData.length; i++) {
    const event = filteredData[i]

    await sendEmbedToChannel(client, {
      embeds: [
        {
          color: COLORS.neutral,
          title: `<:leaf_helper:1433816388497309696> ${event.user}'s rank got changed by ${event.changed_by} from ${event.old_rank} to ${event.new_rank}.`,
          timestamp: event.time,
        },
      ],
    })
  }
}
