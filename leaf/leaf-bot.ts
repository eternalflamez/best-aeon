import { config } from 'dotenv'
import { checkDestruction, setupSelfDestruct } from '../features/utils/self-destruct.ts'
import { Client, Events, GatewayIntentBits, Partials, userMention } from 'discord.js'
import leafBirthdayReminders from './birthdays/leaf-birthday-reminders.ts'
import setupRoles from './roles/setup-roles.ts'

config()

export default function (clientId: string) {
  const TOKEN = process.env.LEAF_TOKEN
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages],
    partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
  })

  client.once(Events.ClientReady, async () => {
    console.log(`LEAF: Logged in as ${client.user?.tag}, ${clientId}`)

    try {
      await leafBirthdayReminders(client)
      await setupSelfDestruct(client, clientId)
      await setupRoles(client)
    } catch (e) {
      console.log('Something went wrong in LEAF', e)
    }
  })

  client.on(Events.MessageCreate, async (message) => {
    if (await checkDestruction(client, clientId, message, 'LEAF')) {
      return
    }
  })

  client.on(Events.GuildMemberRemove, async (member) => {
    try {
      const owner = await member.guild.fetchOwner()
      await owner.send(
        `A member has left ${member.guild.name} - \`${member.displayName}\` with global discord name ${member.user.globalName} (${member.user.id}). ${userMention(member.user.id)}`,
      )
    } catch (e: any) {
      console.error(`Couldn't message guild leader about member leaving: ${e.description}`)
    }
  })

  client.login(TOKEN)
}
