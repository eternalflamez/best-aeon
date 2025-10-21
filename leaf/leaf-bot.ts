import { config } from 'dotenv'
import { checkDestruction, setupSelfDestruct } from '../features/utils/self-destruct.ts'
import { Client, Events, GatewayIntentBits, Partials } from 'discord.js'
import leafBirthdayReminders from './birthdays/leaf-birthday-reminders.ts'
import setupRoles from './roles/setup-roles.ts'

config()

export default function (clientId: string) {
  const TOKEN = process.env.LEAF_TOKEN
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages],
    partials: [Partials.Message, Partials.Channel],
  })

  client.once(Events.ClientReady, async () => {
    console.log(`LEAF: Logged in as ${client.user?.tag}, ${clientId}`)

    try {
      leafBirthdayReminders(client)
      setupSelfDestruct(client, clientId)
      setupRoles(client)
    } catch (e) {
      console.log('Something went wrong in LEAF', e)
    }
  })

  client.on(Events.MessageCreate, async (message) => {
    if (await checkDestruction(client, clientId, message, 'LEAF')) {
      return
    }
  })

  client.login(TOKEN)
}
