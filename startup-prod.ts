import { config } from 'dotenv'
import riseTranslations from './constants/rise-translations.ts'
import htTranslations from './constants/harvest-templars-translations.ts'
import startup from './bot.ts'
import startupLeaf from './leaf/leaf-bot.ts'
import { setupApi } from './leaf/api/generateDiscordInvite.ts'

import SetupBuyerManagement from './features/buyer-management/buyer-management.ts'

import { v4 as uuidv4 } from 'uuid'

config()

const clientId = uuidv4()

SetupBuyerManagement({
  botClientId: clientId,
  guildTag: 'Rise',
  guildId: '1507831199513444402',
  managerToken: process.env.MANAGER_TOKEN!,
  buyerManagementChannelId: '1507836080207040522',
  contactedCategoryChannelId: '1507831199513444402',
  priceEmbedChannelId: '1507836104206712872',
  embedRaidBoss: 'EU Raid Bosses Price List',
  embedRaidAchievements: 'EU Raid Achievements Price List',
  embedFractals: 'EU Fractal Price List',
  embedStrikes: 'EU Strike Price List',
  botRoleId: '1509611072850628751',
  translations: riseTranslations,
})

// SetupBuyerManagement({
//   botClientId: clientId,
//   guildTag: 'HT',
//   guildId: '1281584783323041803',
//   managerToken: process.env.HT_MANAGER_TOKEN!,
//   contactedCategoryChannelId: '1281584783754788971',
//   buyerManagementChannelId: '1281584783507329036',
//   previousBuyersChannelId: '1281584783507329038',
//   priceEmbedChannelId: '1426988240749068509',
//   embedRaidBoss: 'NA Raid Bosses Price List',
//   embedRaidAchievements: 'NA Raid Achievements Price List',
//   embedFractals: 'NA Fractal Price List',
//   embedStrikes: 'NA Strike Price List',
//   botRoleId: '1281615075337310220',
//   translations: htTranslations,
// })

await startup(clientId)

startupLeaf(clientId)

setupApi()
