import { Client } from 'discord.js'
import { sendEmbedToChannel } from './guild-events'

import dedent from 'dedent'

export default async function (client: Client, eventData: EventLog[]) {
  const filteredData = eventData.filter((event) => event.type === 'motd')

  if (!filteredData.length) {
    return
  }

  for (let i = 0; i < Math.min(1, filteredData.length); i++) {
    const event = filteredData[i]

    await sendEmbedToChannel(client, {
      embeds: [
        {
          color: 0x00c853,
          title: '<:leaf_helper:1433816388497309696> The message of the day was changed!',
          description: dedent`\`\`\`
          ${event.motd}
          \`\`\``,
          timestamp: event.time,
        },
      ],
    })
  }
}
