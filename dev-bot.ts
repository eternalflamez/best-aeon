import { config } from 'dotenv'
import { Client, Events, GatewayIntentBits, Partials, TextChannel } from 'discord.js'
import riseTranslations from './constants/rise-translations.ts'

import SetupSellSchedule from './features/sell-schedule.ts'
import SetupBuyerManagement from './features/buyer-management/buyer-management.ts'

// @ts-ignore
import MaxDebug from './onMessageCreateHooks/0.debug.js'
import StartSellThread from './onMessageCreateHooks/1.startSellThread.ts'
import ReplyAsGemini from './onMessageCreateHooks/2.replyAsGemini.ts'
// @ts-ignore
import BestAeon from './onMessageCreateHooks/3.bestAeon.js'
// @ts-ignore
import BestMax from './onMessageCreateHooks/4.bestMax.js'
// @ts-ignore
import WhatsDn from './onMessageCreateHooks/6.whatsDn.js'
import HelloIAm from './onMessageCreateHooks/7.helloIAm.ts'
import Crab from './onMessageCreateHooks/8.crab.ts'
import AddToThread from './onMessageReactionAddHooks/0.addToThread.ts'

import BirthdayReminders from './features/birthday-reminders.ts'

import { v4 as uuidv4 } from 'uuid'

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

const clientId = uuidv4()

client.once('ready', async () => {
  console.log(`Logged in as ${client.user?.tag}`)

  BirthdayReminders(client)

  const botStartedChannel = (await client.channels.fetch('1318663460569092186')) as TextChannel
  botStartedChannel.send(`Succesfully booted! ${clientId}`)
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

client.on(Events.MessageCreate, async (message) => {
  if (
    message.channelId === '1318663460569092186' &&
    message.author.id === client.user?.id &&
    !message.content.includes(clientId)
  ) {
    client.destroy()
    return
  }

  if (message.author.bot || message.system) return

  try {
    const messageText = message.content.toLowerCase()

    if (await MaxDebug(messageText, message, maxCounter)) {
      return
    }

    await Crab(message)

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
