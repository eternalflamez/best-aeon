import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
  PermissionFlagsBits,
  InteractionContextType,
} from 'discord.js'
import leafDb from '../../leaf-firestore.ts'

const command = {
  data: new SlashCommandBuilder()
    .setName('admin-birthday-remove')
    .setDescription('Remove a birthday')
    .addUserOption((option) => option.setName('user').setDescription('The user to remove').setRequired(true))
    .setContexts([InteractionContextType.Guild])
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction: ChatInputCommandInteraction) {
    try {
      const user = interaction.options.getUser('user')

      if (!user) {
        await interaction.reply({
          content: 'The user could not be found!',
          flags: MessageFlags.Ephemeral,
        })

        return
      }

      await leafDb?.collection('birthdays').doc(user.id).delete()

      await interaction.reply({
        content: 'The birthday was removed succesfully!',
        flags: MessageFlags.Ephemeral,
      })
    } catch (e) {
      console.log(e)

      await interaction.reply({
        content: 'There was an error removing the birthday!',
        flags: MessageFlags.Ephemeral,
      })
    }
  },
}

export default command
