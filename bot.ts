import { Client, Events, GatewayIntentBits, Partials } from 'discord.js'
import { config } from 'dotenv'
import birthdayReminders from './features/birthday-reminders.ts'
import { checkDestruction, setupSelfDestruct } from './features/utils/self-destruct.ts'
import { MessageHandler } from './types/MessageHandler.ts'
import CrabHandler from './features/best-aeon/CrabHandler.ts'
import StartSellThreadHandler from './features/best-aeon/StartSellThreadHandler.ts'
import GeminiHandler from './features/best-aeon/GeminiHandler.ts'
import BestAeonHandler from './features/best-aeon/BestAeonHandler.ts'
import BestMaxHandler from './features/best-aeon/BestMaxHandler.ts'
import WhatsDnHandler from './features/best-aeon/WhatsDnHandler.ts'
import HelloIAmHandler from './features/best-aeon/HelloIAmHandler.ts'
import AddToThread from './onMessageReactionAddHooks/0.addToThread.ts'
import SetupSellSchedule from './features/sell-schedule.ts'
import DmHandler from './features/best-aeon/DmHandler.ts'
import FlowerMarkerPackHandler from './features/best-aeon/FlowerMarkerPackHandler.ts'

config()

export default function (clientId: string) {
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
    setupSelfDestruct(client, clientId)
  })

  const handlers: MessageHandler[] = [
    new DmHandler(client),
    new CrabHandler(),
    new StartSellThreadHandler(),
    new GeminiHandler(client),
    new BestAeonHandler(),
    new BestMaxHandler(),
    new WhatsDnHandler(),
    new FlowerMarkerPackHandler(),
    new HelloIAmHandler(client),
  ]

  client.on(Events.MessageCreate, async (message) => {
    if (await checkDestruction(client, clientId, message, 'gemini')) {
      return
    }

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

  client.on(Events.MessageReactionAdd, async (reaction, user) => {
    await AddToThread(reaction, user)
  })

  client.login(TOKEN)

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
}
