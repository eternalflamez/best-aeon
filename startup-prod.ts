import { config } from 'dotenv'
import riseTranslations from './constants/rise-translations.ts'
import htTranslations from './constants/harvest-templars-translations.ts'

import SetupBuyerManagement from './features/buyer-management/buyer-management.ts'

import { v4 as uuidv4 } from 'uuid'

config()

const clientId = uuidv4()

SetupBuyerManagement({
  botClientId: clientId,
  guildTag: 'Rise',
  guildId: '1054032215446663278',
  managerToken: process.env.MANAGER_TOKEN!,
  contactedCategoryChannelId: '1269269252305715221',
  buyerManagementChannelId: '1264584361034911856',
  previousBuyersChannelId: '1271876573351383174',
  priceEmbedChannelId: '1264595533515980820',
  embedRaidBoss: '1264596066444115969',
  embedRaidAchievements: '1264596103995723829',
  embedFractals: '1264596136778268772',
  embedStrikes: '1264596122710573130',
  botRoleId: '1264588777121382527',
  translations: riseTranslations,
})

SetupBuyerManagement({
  botClientId: clientId,
  guildTag: 'HT',
  guildId: '1281584783323041803',
  managerToken: process.env.HT_MANAGER_TOKEN!,
  contactedCategoryChannelId: '1281584783754788971',
  buyerManagementChannelId: '1281584783507329036',
  previousBuyersChannelId: '1281584783507329038',
  priceEmbedChannelId: '1281584783754788967',
  embedRaidBoss: '1282735829604630640',
  embedRaidAchievements: '1282735886869598219',
  embedFractals: '1282735938010878035',
  embedStrikes: '1282735912639533210',
  botRoleId: '1281615075337310220',
  translations: htTranslations,
})
