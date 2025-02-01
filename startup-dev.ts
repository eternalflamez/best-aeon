import { config } from 'dotenv'
import riseTranslations from './constants/rise-translations.ts'
import startup from './bot.ts'

import SetupBuyerManagement from './features/buyer-management/buyer-management.ts'

import { v4 as uuidv4 } from 'uuid'

config()

const clientId = uuidv4()

SetupBuyerManagement({
  botClientId: clientId,
  guildTag: 'Rice',
  guildId: '1248337933413650614',
  managerToken: process.env.MANAGER_TOKEN!,
  contactedCategoryChannelId: '1269279315590250600',
  buyerManagementChannelId: '1263780410089799726',
  previousBuyersChannelId: '1271422645606285374',
  priceEmbedChannelId: '1263915263682809989',
  embedRaidBoss: '1263940136081686614',
  embedRaidAchievements: '1263940136081686614',
  embedFractals: '1263940136081686614',
  embedStrikes: '1263940136081686614',
  botRoleId: '1264610829811056718',
  translations: riseTranslations,
})

startup(clientId)
