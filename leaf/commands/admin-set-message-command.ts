import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
  PermissionFlagsBits,
  userMention,
  InteractionContextType,
} from 'discord.js'
import leafDb from '../leaf-firestore.ts'

const command = {
  data: new SlashCommandBuilder()
    .setName('admin-set-message')
    .setDescription('Sets the birthday message')
    .addStringOption((option) =>
      option
        .setName('message')
        .setDescription('The message to display when it is someones birthday. Can use {MENTION} to ping the user.')
        .setRequired(true),
    )
    .setContexts([InteractionContextType.Guild])
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction: ChatInputCommandInteraction) {
    try {
      const message = interaction.options.getString('message')!

      await leafDb?.collection('util').doc('birthday-message').set({
        message,
      })

      await interaction.reply({
        content: `The birthday message was set succesfully!\r\n\r\n${message.replaceAll('{MENTION}', userMention(interaction.user.id))}`,
        flags: MessageFlags.Ephemeral,
      })
    } catch (e) {
      console.log(e)

      await interaction.reply({
        content: 'There was an error updating the message!',
        flags: MessageFlags.Ephemeral,
      })
    }
  },
}

export default command
