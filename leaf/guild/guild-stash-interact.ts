import { APIEmbed, Client } from 'discord.js'
import { config } from 'dotenv'
import { sendEmbedToChannel } from './guild-events'
import { GuildWarsData } from './gw-api'

config()

export default async function (client: Client, eventData: EventLog[]) {
  const filteredData = eventData.filter((event) => event.type === 'stash')

  if (filteredData.length) {
    for (let i = 0; i < filteredData.length; i++) {
      const event = filteredData[i]

      if (event.operation === 'move') {
        continue
      }

      let embed: APIEmbed = {
        color: 0x00bfa5,
      }

      let action = event.operation === 'deposit' ? 'deposited' : 'withdrew'

      if (event.item_id) {
        const item = await GuildWarsData.getItem(event.item_id)
        const itemUrl = `https://wiki.guildwars2.com/index.php?search=${encodeURIComponent(item.chat_link)}&go=Go&ns0=1`

        embed.url = itemUrl
        embed.title = `A user ${action} items!`
        embed.description = `User \`${event.user}\` ${action} ${event.count} [${item.name}](${itemUrl})`
        embed.thumbnail = item.icon
          ? {
              url: item.icon,
            }
          : undefined
      } else {
        embed.url = 'https://wiki.guildwars2.com/wiki/Coin'
        embed.title = `<:mystic_coin:988818544982630550> A user ${action} gold!`
        embed.description = `User \`${event.user}\` ${action} ${event.coins / 10_000} gold! <:mystic_coin:988818544982630550>`
      }

      embed.timestamp = event.time

      await sendEmbedToChannel(client, {
        embeds: [embed],
      })
    }
  }
}
