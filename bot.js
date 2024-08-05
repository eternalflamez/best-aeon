// require('dotenv').config()
import { Client, GatewayIntentBits, Partials } from 'discord.js'

import * as SetupSellHistory from './features/sell-schedule.ts'
import * as SetupBuyerManagement from './features/buyer-management.ts'

import MaxDebug from './onMessageCreateHooks/0.debug.js'
import StartSellThread from './onMessageCreateHooks/1.startSellThread.ts'
import ReplyAsGemini from './onMessageCreateHooks/2.replyAsGemini.js'
import BestAeon from './onMessageCreateHooks/3.bestAeon.js'
import BestMax from './onMessageCreateHooks/4.bestMax.js'
import AustrianNow from './onMessageCreateHooks/5.austrianNow.js'
import WhatsDn from './onMessageCreateHooks/6.whatsDn.js'
import HelloIAm from './onMessageCreateHooks/7.helloIAm.js'

import AddToThread from './onMessageReactionAddHooks/0.addToThread.js'

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

SetupSellHistory.default(client, '1270068487674658816', ['NA', 'EU'])
SetupSellHistory.default(client, '1263126224247717928', ['EU'])
SetupSellHistory.default(client, '1263276208028778619', ['NA'])
SetupBuyerManagement.default()

client.on('messageCreate', async (message) => {
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
  } catch (e) {
    if (e.rawError?.message === 'Missing Permissions') {
      return
    }

    console.error(e)
  }
})

client.on('messageReactionAdd', async (reaction, user) => {
  await AddToThread(reaction, user)
})

client.login(TOKEN)
