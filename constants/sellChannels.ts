import type { GuildSellScheduleConfig } from '../types/GuildSellScheduleConfig'

const channelToGuildRegion = new Map<string, { guildId: string; region: string }>()

export function initSellScheduleGuilds(configs: GuildSellScheduleConfig[]) {
  channelToGuildRegion.clear()
  for (const g of configs) {
    for (const [channelId, meta] of Object.entries(g.sellChannels)) {
      channelToGuildRegion.set(channelId, { guildId: g.guildId, region: meta.region })
    }
  }
}

export function isValidSellChannel(guildId: string | null | undefined, channelId: string): boolean {
  if (!guildId) return false
  const hit = channelToGuildRegion.get(channelId)
  return hit?.guildId === guildId
}

export function getRegion(guildId: string | null | undefined, channelId: string): string | null {
  if (!guildId) return null
  const hit = channelToGuildRegion.get(channelId)
  if (hit?.guildId === guildId) {
    return hit.region
  }
  return null
}
