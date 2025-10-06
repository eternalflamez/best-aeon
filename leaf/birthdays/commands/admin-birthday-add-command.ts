import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits } from 'discord.js'
import leafDb from '../../leaf-firestore.ts'

const command = {
  data: new SlashCommandBuilder()
    .setName('admin-birthday-register')
    .setDescription('Add a birthday')
    .addUserOption((option) => option.setName('user').setDescription('The user to add').setRequired(true))
    .addIntegerOption((option) => option.setName('day').setDescription('The day of the birthday').setRequired(true))
    .addIntegerOption((option) => option.setName('month').setDescription('The month of the birthday').setRequired(true))
    .addIntegerOption((option) => option.setName('year').setDescription('The year of the birthday').setRequired(false))
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

      await leafDb
        ?.collection('birthdays')
        .doc(user.id)
        .set({
          id: user.id,
          day: interaction.options.getInteger('day'),
          month: interaction.options.getInteger('month'),
          year: interaction.options.getInteger('year'),
        })

      await interaction.reply({
        content: 'The birthday was added succesfully!',
        flags: MessageFlags.Ephemeral,
      })
    } catch (e) {
      console.log(e)

      await interaction.reply({
        content: 'There was an error adding the birthday!',
        flags: MessageFlags.Ephemeral,
      })
    }
  },
}

export default command
