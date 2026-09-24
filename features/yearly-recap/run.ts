/**
 * Manual Je Wrapped runner.
 *
 * Usage:
 *   npx tsx features/yearly-recap/run.ts
 *   npx tsx features/yearly-recap/run.ts --year=2026
 *   npx tsx features/yearly-recap/run.ts --year=2026 --send
 *   npx tsx features/yearly-recap/run.ts --guild=544892003545251841
 *
 * Loads env-presets/prod.env (needs ENVIRONMENT=production + TOKEN + GEMINI_KEY).
 */
import { config } from 'dotenv'
import { Client, Events, GatewayIntentBits } from 'discord.js'

config({ path: 'env-presets/prod.env' })

const { currentWrapYear } = await import('../../firestore/wrapYear')
const { sendRewind } = await import('./herbert-rewind')

function argValue(name: string): string | undefined {
  const prefix = `--${name}=`
  const hit = process.argv.find((a) => a.startsWith(prefix))
  return hit?.slice(prefix.length)
}

const year = Number(process.env.WRAP_YEAR || argValue('year') || currentWrapYear() - 1)
const guildId = argValue('guild') || process.env.WRAP_GUILD_ID
const send = process.argv.includes('--send')

if (!Number.isFinite(year)) {
  console.error('Invalid year')
  process.exit(1)
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
})

client.once(Events.ClientReady, async () => {
  try {
    console.log(`Logged in as ${client.user?.tag}`)
    await sendRewind(client, { year, guildId, send })
  } catch (e) {
    console.error(e)
    process.exitCode = 1
  } finally {
    client.destroy()
  }
})

await client.login(process.env.TOKEN)
