import { Client, Events, GatewayIntentBits, Partials } from 'discord.js'
import { config } from 'dotenv'
import birthdayReminders from './features/birthday-reminders'
import { setupSelfDestruct } from './features/utils/self-destruct'
import { MessageHandler } from './types/MessageHandler'
import CrabHandler from './features/best-aeon/CrabHandler'
import StartSellThreadHandler from './features/best-aeon/StartSellThreadHandler'
import HerbertHandler from './features/best-aeon/HerbertHandler'
import BestAeonHandler from './features/best-aeon/BestAeonHandler'
import BestMaxHandler from './features/best-aeon/BestMaxHandler'
import WhatsDnHandler from './features/best-aeon/WhatsDnHandler'
import HelloIAmHandler from './features/best-aeon/HelloIAmHandler'
import AddToThread from './onMessageReactionAddHooks/0.addToThread'
import SetupSellSchedule from './features/sell-schedule'
import DmHandler from './features/best-aeon/DmHandler'
import FlowerMarkerPackHandler from './features/best-aeon/FlowerMarkerPackHandler'
import { initSellScheduleGuilds } from './constants/sellChannels'
import { loadSellScheduleGuildConfigs } from './firestore/sellScheduleConfig'

config()

export default async function (clientId: string) {
  const sellScheduleGuilds = await loadSellScheduleGuildConfigs()
  initSellScheduleGuilds(sellScheduleGuilds)

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

  client.once(Events.ClientReady, async () => {
    console.log(`Logged in as ${client.user?.tag}, ${clientId}`)

    birthdayReminders(client)
    setupSelfDestruct(client, clientId, 'best-aeon')
  })

  const handlers: MessageHandler[] = [
    new DmHandler(client),
    new CrabHandler(),
    new StartSellThreadHandler(),
    new HerbertHandler(client),
    new BestAeonHandler(),
    new BestMaxHandler(),
    new WhatsDnHandler(),
    new FlowerMarkerPackHandler(),
    new HelloIAmHandler(client),
  ]

  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || message.system) return

    try {
      for (const handler of handlers) {
        if (await handler.handle(message)) {
          return
        }
      }
    } catch (e: any) {
      if (e.rawError?.message === 'Missing Permissions') {
        return
      }

      console.error(e)
    }
  })

  const sellScheduleReactions = sellScheduleGuilds.length > 0 ? SetupSellSchedule(client, sellScheduleGuilds) : null

  client.on(Events.MessageReactionAdd, async (reaction, user) => {
    await AddToThread(reaction, user)
    await sellScheduleReactions?.onReactionAdd(reaction, user)
  })

  client.on(Events.MessageReactionRemove, async (reaction, user) => {
    await sellScheduleReactions?.onReactionRemove(reaction, user)
  })

  client.login(TOKEN)
}
