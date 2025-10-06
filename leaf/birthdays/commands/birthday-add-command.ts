import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits } from 'discord.js'
import leafDb from '../../leaf-firestore.ts'

const command = {
  data: new SlashCommandBuilder()
    .setName('birthday-register')
    .setDescription('Add your birthday')
    .addIntegerOption((option) => option.setName('day').setDescription('The day of your birthday').setRequired(true))
    .addIntegerOption((option) =>
      option.setName('month').setDescription('The month of your birthday').setRequired(true),
    )
    .addIntegerOption((option) =>
      option.setName('year').setDescription('The year of your birthday').setRequired(false),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    try {
      await leafDb
        ?.collection('birthdays')
        .doc(interaction.user.id)
        .set({
          id: interaction.user.id,
          day: interaction.options.getInteger('day'),
          month: interaction.options.getInteger('month'),
          year: interaction.options.getInteger('year'),
        })

      await interaction.reply({
        content: 'Your birthday was added succesfully!',
        flags: MessageFlags.Ephemeral,
      })
    } catch (e) {
      console.log(e)

      await interaction.reply({
        content: 'There was an error adding your birthday!',
        flags: MessageFlags.Ephemeral,
      })
    }
  },
}

export default command
