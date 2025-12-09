import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
  PermissionFlagsBits,
  GuildMember,
} from 'discord.js'
import leafDb from '../leaf-firestore.ts'

const command = {
  data: new SlashCommandBuilder()
    .setName('birthday-register')
    .setDescription('Add your birthday')
    .addIntegerOption((option) =>
      option.setName('day').setDescription('The day of your birthday').setMinValue(1).setMaxValue(31).setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName('month')
        .setDescription('The month (1-12) of your birthday')
        .setMinValue(1)
        .setMaxValue(12)
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option.setName('year').setDescription('The year of your birthday').setRequired(false),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    try {
      const day = interaction.options.getInteger('day')
      const month = interaction.options.getInteger('month')
      const year = interaction.options.getInteger('year')

      const dateString = `${month}/${day}${year ? '/' + year : ''}`
      const date = new Date(dateString)
      const allowedDate = !year && day === 29 && month === 2

      if ((date.getDate() !== day || date.getMonth() + 1 !== month) && !allowedDate) {
        await interaction.reply({
          content: 'Your entered birthday is not a valid date!',
          flags: MessageFlags.Ephemeral,
        })
        return
      }

      await leafDb
        ?.collection('birthdays')
        .doc(interaction.user.id)
        .set({
          id: interaction.user.id,
          display: (interaction.member as GuildMember).displayName,
          day,
          month,
          year,
        })

      await interaction.reply({
        content: `Your birthday was added as "${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}${year ? '/' + year : ''}" succesfully!`,
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
