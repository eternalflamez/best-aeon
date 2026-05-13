import { Client } from 'discord.js'

export type SellScheduleGuildLogger = {
  log: (...args: unknown[]) => void
  info: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
}

function guildTag(client: Client, guildId: string): string {
  const name = client.guilds.cache.get(guildId)?.name ?? 'unknown'
  return `[SellSchedule guildName="${name}" guildId=${guildId}]`
}

export function createSellScheduleGuildLogger(client: Client, guildId: string): SellScheduleGuildLogger {
  const tag = () => guildTag(client, guildId)
  return {
    log: (...args: unknown[]) => console.log(tag(), ...args),
    info: (...args: unknown[]) => console.info(tag(), ...args),
    warn: (...args: unknown[]) => console.warn(tag(), ...args),
    error: (...args: unknown[]) => console.error(tag(), ...args),
  }
}
