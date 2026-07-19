import type {
  GuildSellScheduleConfig,
  SellScheduleConfigFirestoreDoc,
  SellScheduleFirestoreChannelEntry,
} from '../types/GuildSellScheduleConfig'
import db from './setupFirestore'

export const SELL_SCHEDULE_CONFIG_COLLECTION = 'sell_schedule_config'

const LOCAL_FALLBACK_CONFIGS: GuildSellScheduleConfig[] = [
  {
    guildId: '1248337933413650614',
    sellChannels: {
      '1249829604974268418': { region: 'EU' },
      '1263079097408688155': { region: 'NA' },
    },
    scheduleOutputs: [
      { id: '1263079031645933618', regions: ['NA', 'EU'] },
      { id: '1270111631573127178', regions: ['EU'] },
      { id: '1270111650229387306', regions: ['NA'] },
    ],
  },
]

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
    console.warn(`[${SELL_SCHEDULE_CONFIG_COLLECTION}] Firestore db not initialized; using local fallback configs.`)
    return LOCAL_FALLBACK_CONFIGS
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
