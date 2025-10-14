import { config } from 'dotenv'
import riseTranslations from './constants/rise-translations.ts'
import startup from './bot.ts'
import startupLeaf from './leaf/leaf-bot.ts'

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
  priceEmbedChannelId: '1426138997415219301',
  embedRaidBoss: 'DuGz46p6Ccx9ZkOd4F1T',
  embedRaidAchievements: 'IKlrMn3nF739xn2CO93i',
  embedFractals: 'JCqiHCV1lxMjVxvmfUgD',
  embedStrikes: 'cALy5pc91wyaam0kK6MJ',
  botRoleId: '1264610829811056718',
  translations: riseTranslations,
})

startup(clientId)

startupLeaf(clientId)
