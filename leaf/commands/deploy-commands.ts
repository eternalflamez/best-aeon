import { REST, Routes } from 'discord.js'
import { config } from 'dotenv'

import configCommand from './config-command.ts'
import adminBirthdayAddCommand from './admin-birthday-add-command.ts'
import adminBirthdayRemoveCommand from './admin-birthday-remove-command.ts'
import birthdayAddCommand from './birthday-add-command.ts'
import birthdayRemoveCommand from './birthday-remove-command.ts'
import setMessageCommand from './admin-set-message-command.ts'

config()

const token = process.env.LEAF_TOKEN
const clientId = process.env.LEAF_CLIENT_ID
const guildId = process.env.LEAF_DISCORD_GUILD_ID

if (!token || !clientId || !guildId) {
  console.error('Set LEAF_TOKEN, LEAF_CLIENT_ID, and LEAF_DISCORD_GUILD_ID before deploying commands.')
  process.exit(1)
}

const commands = [
  configCommand.data.toJSON(),
  adminBirthdayAddCommand.data.toJSON(),
  adminBirthdayRemoveCommand.data.toJSON(),
  birthdayAddCommand.data.toJSON(),
  birthdayRemoveCommand.data.toJSON(),
  setMessageCommand.data.toJSON(),
]

const rest = new REST().setToken(token)

try {
  console.log(`Deploying ${commands.length} LEAF guild commands to ${guildId}...`)
  // await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
  console.log('LEAF commands deployed.')
} catch (error) {
  console.error(error)
  process.exit(1)
}
