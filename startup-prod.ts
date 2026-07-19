import './env'
import riseTranslations from './constants/rise-translations'
import startup from './bot'
import startupLeaf from './leaf/leaf-bot'
import { setupApi } from './leaf/api/generateDiscordInvite'

import SetupBuyerManagement from './features/buyer-management/buyer-management'

import { v4 as uuidv4 } from 'uuid'

const clientId = uuidv4()

SetupBuyerManagement({
  botClientId: clientId,
  guildTag: 'Rise',
  guildId: '1507831199513444402',
  managerToken: process.env.MANAGER_TOKEN!,
  buyerManagementChannelId: '1507836080207040522',
  contactedCategoryChannelId: '1511414123445878845',
  priceEmbedChannelId: '1507836104206712872',
  embedRaidBoss: 'EU Raid Bosses Price List',
  embedRaidAchievements: 'EU Raid Achievements Price List',
  embedFractals: 'EU Fractal Price List',
  embedStrikes: 'EU Strike Price List',
  botRoleId: '1509611072850628751',
  translations: riseTranslations,
})

await startup(clientId)

startupLeaf(clientId)

setupApi()
