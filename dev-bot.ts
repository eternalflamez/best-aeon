import { config } from 'dotenv'
import { Client, Events, GatewayIntentBits, Partials } from 'discord.js'
import riseTranslations from './constants/rise-translations.ts'

import SetupSellSchedule from './features/sell-schedule.ts'
import SetupBuyerManagement from './features/buyer-management.ts'

// @ts-ignore
import MaxDebug from './onMessageCreateHooks/0.debug.js'
import StartSellThread from './onMessageCreateHooks/1.startSellThread.ts'
// @ts-ignore
import ReplyAsGemini from './onMessageCreateHooks/2.replyAsGemini.ts'
// @ts-ignore
import BestAeon from './onMessageCreateHooks/3.bestAeon.js'
// @ts-ignore
import BestMax from './onMessageCreateHooks/4.bestMax.js'
// @ts-ignore
import AustrianNow from './onMessageCreateHooks/5.austrianNow.js'
// @ts-ignore
import WhatsDn from './onMessageCreateHooks/6.whatsDn.js'
// @ts-ignore
import HelloIAm from './onMessageCreateHooks/7.helloIAm.ts'
// @ts-ignore
import AddToThread from './onMessageReactionAddHooks/0.addToThread.ts'

config()

const TOKEN = process.env.TOKEN
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
})

let maxCounter = {
  value: 1,
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user?.tag}`)
})

SetupSellSchedule(client, [
  {
    id: process.env.SELL_CHANNEL_BOTH!,
    regions: ['NA', 'EU'],
  },
  {
    id: process.env.SELL_CHANNEL_EU!,
    regions: ['EU'],
  },
  {
    id: process.env.SELL_CHANNEL_NA!,
    regions: ['NA'],
  },
])

SetupBuyerManagement({
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

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || message.system) return

  try {
    const messageText = message.content.toLowerCase()

    if (await MaxDebug(messageText, message, maxCounter)) {
      return
    }

    if (await StartSellThread(messageText, message)) {
      return
    }

    if (await ReplyAsGemini(client, message)) {
      return
    }

    if (await BestAeon(message)) {
      return
    }

    if (await BestMax(messageText, message, maxCounter)) {
      return
    }

    if (await AustrianNow(messageText, message)) {
      return
    }

    if (await WhatsDn(messageText, message)) {
      return
    }

    if (await HelloIAm(client, message)) {
      return
    }
  } catch (e: any) {
    if (e.rawError?.message === 'Missing Permissions') {
      return
    }

    console.error(e)
  }
})

client.on(Events.MessageReactionAdd, async (reaction, user) => {
  await AddToThread(reaction, user)
})

client.login(TOKEN)
