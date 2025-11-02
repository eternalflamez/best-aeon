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
    .setName('admin-birthday-register')
    .setDescription('Add a birthday')
    .addUserOption((option) => option.setName('user').setDescription('The user to add').setRequired(true))
    .addIntegerOption((option) =>
      option.setName('day').setDescription('The day of the birthday').setMinValue(1).setMaxValue(31).setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName('month')
        .setDescription('The month (1-12) of the birthday')
        .setMinValue(1)
        .setMaxValue(12)
        .setRequired(true),
    )
    .addIntegerOption((option) => option.setName('year').setDescription('The year of the birthday').setRequired(false))
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

      await leafDb?.collection('birthdays').doc(user.id).set({
        id: user.id,
        display: user.displayName,
        day,
        month,
        year,
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
