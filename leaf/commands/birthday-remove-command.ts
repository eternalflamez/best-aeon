import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js'
import leafDb from '../leaf-firestore.ts'

const command = {
  data: new SlashCommandBuilder().setName('birthday-remove').setDescription('Remove your birthday'),
  async execute(interaction: ChatInputCommandInteraction) {
    try {
      await leafDb?.collection('birthdays').doc(interaction.user.id).delete()

      await interaction.reply({
        content: 'Your birthday was removed succesfully!',
        flags: MessageFlags.Ephemeral,
      })
    } catch (e) {
      console.log(e)

      await interaction.reply({
        content: 'There was an error removing your birthday!',
        flags: MessageFlags.Ephemeral,
      })
    }
  },
}

export default command
