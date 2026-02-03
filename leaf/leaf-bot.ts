import { config } from 'dotenv'
import { checkDestruction, setupSelfDestruct } from '../features/utils/self-destruct.ts'
import {
  ChatInputCommandInteraction,
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  MessageFlags,
  Partials,
  userMention,
} from 'discord.js'
import leafBirthdayReminders from './birthdays/leaf-birthday-reminders.ts'
import setupRoles from './roles/setup-roles.ts'
import configCommand from './commands/config-command.ts'
import adminBirthdayAddCommand from './commands/admin-birthday-add-command.ts'
import adminBirthdayRemoveCommand from './commands/admin-birthday-remove-command.ts'
import birthdayAddCommand from './commands/birthday-add-command.ts'
import birthdayRemoveCommand from './commands/birthday-remove-command.ts'
import setMessageCommand from './commands/admin-set-message-command.ts'
import verifyGwLinkCommand from './commands/verify-gw-link-command.ts'
import processGuildEvents, { sendEmbedToChannel } from './guild/guild-events.ts'
import { showVerifyAccountModal } from './verify-account/show-verify-account-modal.ts'
import { verifyAccount } from './verify-account/verify-account.ts'
import { COLORS } from './constants/colors.ts'
import { GuildWarsData } from './guild/gw-api.ts'

config()

export default function (clientId: string) {
  const TOKEN = process.env.LEAF_TOKEN
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.DirectMessages,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
  })

  client.once(Events.ClientReady, async () => {
    console.log(`LEAF: Logged in as ${client.user?.tag}, ${clientId}`)

    try {
      await processGuildEvents(client)
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

      const currentMembers = await GuildWarsData.getMembers()

      const accountPart = member.displayName.match(/(\w+\.\d{4})/)?.[1] ?? null
      const matchedGw2Name =
        accountPart != null
          ? currentMembers.find((m) => m.name.toLowerCase().includes(accountPart.toLowerCase()))?.name
          : undefined

      const embedDescription =
        matchedGw2Name != null
          ? `User \`${member.displayName}\` has left the discord. They are still in the guild: \`${matchedGw2Name}\`.`
          : `User \`${member.displayName}\` has left the discord. I could not find a matching user in the guild.`

      await sendEmbedToChannel(client, {
        embeds: [
          {
            color: COLORS.negative,
            title: '⚠️ A user left the discord!',
            description: embedDescription,
            timestamp: new Date().toISOString(),
          },
        ],
      })
    } catch (e: any) {
      console.error(`Couldn't message guild leader about member leaving: ${e.description}`)
    }
  })

  const commands = new Collection<
    String,
    { execute: (interaction: ChatInputCommandInteraction, client: Client) => Promise<void> }
  >()
  commands.set(configCommand.data.name, configCommand)
  commands.set(adminBirthdayAddCommand.data.name, adminBirthdayAddCommand)
  commands.set(adminBirthdayRemoveCommand.data.name, adminBirthdayRemoveCommand)
  commands.set(birthdayAddCommand.data.name, birthdayAddCommand)
  commands.set(birthdayRemoveCommand.data.name, birthdayRemoveCommand)
  commands.set(setMessageCommand.data.name, setMessageCommand)
  commands.set(verifyGwLinkCommand.data.name, verifyGwLinkCommand)

  client.on(Events.InteractionCreate, async (interaction) => {
    try {
      if (await showVerifyAccountModal(interaction)) {
        return
      }

      if (await verifyAccount(interaction)) {
        return
      }
    } catch (error) {
      console.error('error in leaf bot interaction')
      console.error(error)
    }

    if (!interaction.isChatInputCommand()) return

    const command = commands.get(interaction.commandName)

    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`)

      await interaction.reply({
        content: 'Sorry this bot was not setup correctly for that command.',
        flags: MessageFlags.Ephemeral,
      })
      return
    }

    try {
      await command.execute(interaction, client)
    } catch (error) {
      console.error(error)
    }
  })

  client.login(TOKEN)
}
