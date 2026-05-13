/** One guild's sell schedule wiring (in-memory after Firestore load). */
export type GuildSellScheduleConfig = {
  guildId: string
  sellChannels: Record<string, { region: string }>
  scheduleOutputs: { id: string; regions: string[] }[]
}

/** Flattened summary channel with owning guild (derived from GuildSellScheduleConfig). */
export type SellScheduleOutputChannel = {
  guildId: string
  id: string
  regions: string[]
}

/** Raw Firestore document under `sell_schedule_config` (document id = guildId). */
export type SellScheduleConfigFirestoreDoc = {
  sellChannels?: Record<string, { region: string }> | SellScheduleFirestoreChannelEntry[]
  scheduleOutputs?: { id: string; regions: string[] }[]
}

export type SellScheduleFirestoreChannelEntry = {
  channelId: string
  region: string
}
