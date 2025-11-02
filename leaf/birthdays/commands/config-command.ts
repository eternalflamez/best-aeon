import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
  PermissionFlagsBits,
  ChannelType,
  InteractionContextType,
} from 'discord.js'
import leafDb from '../../leaf-firestore.ts'

const command = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Sets up the birthday notification channel!')
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('The channel to post birthday notifications into')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true),
    )
    .setContexts([InteractionContextType.Guild])
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction: ChatInputCommandInteraction) {
    try {
      const doc = leafDb?.collection('util').doc('birthday-channel')

      doc?.update({
        id: interaction.options.getChannel('channel')?.id,
      })

      await interaction.reply({
        content: 'Channel updated succesfully!',
        flags: MessageFlags.Ephemeral,
      })
    } catch (e) {
      await interaction.reply({
        content: 'Could not set new channel!',
        flags: MessageFlags.Ephemeral,
      })
    }
  },
}

export default command
