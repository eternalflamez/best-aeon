import type {
  GuildSellScheduleConfig,
  SellScheduleConfigFirestoreDoc,
  SellScheduleFirestoreChannelEntry,
} from '../types/GuildSellScheduleConfig.ts'
import db from './setupFirestore.ts'

export const SELL_SCHEDULE_CONFIG_COLLECTION = 'sell_schedule_config'

function normalizeSellChannels(
  raw: SellScheduleConfigFirestoreDoc['sellChannels'],
): Record<string, { region: string }> {
  if (!raw) return {}

  if (Array.isArray(raw)) {
    const out: Record<string, { region: string }> = {}

    for (const row of raw as SellScheduleFirestoreChannelEntry[]) {
      if (row?.channelId && row?.region) {
        out[row.channelId] = { region: row.region }
      }
    }
    return out
  }

  return { ...(raw as Record<string, { region: string }>) }
}

export async function loadSellScheduleGuildConfigs(): Promise<GuildSellScheduleConfig[]> {
  if (!db) {
    console.warn(`[${SELL_SCHEDULE_CONFIG_COLLECTION}] Firestore db not initialized; no sell schedule guilds loaded.`)
    return []
  }

  const snap = await db.collection(SELL_SCHEDULE_CONFIG_COLLECTION).get()
  const configs: GuildSellScheduleConfig[] = []

  for (const doc of snap.docs) {
    const data = doc.data() as SellScheduleConfigFirestoreDoc
    const guildId = doc.id
    const sellChannels = normalizeSellChannels(data.sellChannels)
    const scheduleOutputs = Array.isArray(data.scheduleOutputs) ? data.scheduleOutputs : []

    if (!Object.keys(sellChannels).length || !scheduleOutputs.length) {
      console.warn(
        `[${SELL_SCHEDULE_CONFIG_COLLECTION}] Skipping guild ${guildId}: need non-empty sellChannels and scheduleOutputs.`,
      )
      continue
    }

    configs.push({ guildId, sellChannels, scheduleOutputs })
  }

  return configs
}
