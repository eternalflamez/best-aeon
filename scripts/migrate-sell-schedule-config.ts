/**
 * One-time migration: writes `sell_schedule_config/{guildId}` from `.env`
 * `SELL_CHANNEL_*` and the legacy sell source channel map.
 *
 * Usage: `GUILD_ID=<snowflake> npx tsx scripts/migrate-sell-schedule-config.ts`
 * Requires `SELL_CHANNEL_BOTH`, `SELL_CHANNEL_EU`, `SELL_CHANNEL_NA` in `.env`.
 */
import { config } from 'dotenv'

config()

import db from '../firestore/setupFirestore.ts'
import { SELL_SCHEDULE_CONFIG_COLLECTION } from '../firestore/sellScheduleConfig.ts'

/** Same channel ids as the pre-Firestore `constants/sellChannels.ts` map (active entries only). */
const LEGACY_SELL_CHANNELS: Record<string, { region: string }> = {
  '982039087663951892': { region: 'EU' },
  '1444445198758187071': { region: 'EU' },
  '1196923586791874640': { region: 'NA' },
}

async function main() {
  const guildId = process.env.GUILD_ID
  if (!guildId) {
    console.error('Set GUILD_ID to the Discord guild snowflake for this document.')
    process.exit(1)
  }

  const both = process.env.SELL_CHANNEL_BOTH
  const eu = process.env.SELL_CHANNEL_EU
  const na = process.env.SELL_CHANNEL_NA
  if (!both || !eu || !na) {
    console.error('Missing SELL_CHANNEL_BOTH, SELL_CHANNEL_EU, or SELL_CHANNEL_NA in .env')
    process.exit(1)
  }

  if (!db) {
    console.error('Firestore not initialized')
    process.exit(1)
  }

  const payload = {
    sellChannels: LEGACY_SELL_CHANNELS,
    scheduleOutputs: [
      { id: both, regions: ['NA', 'EU'] },
      { id: eu, regions: ['EU'] },
      { id: na, regions: ['NA'] },
    ],
  }

  await db.collection(SELL_SCHEDULE_CONFIG_COLLECTION).doc(guildId).set(payload)
  console.log(`Wrote ${SELL_SCHEDULE_CONFIG_COLLECTION}/${guildId}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
