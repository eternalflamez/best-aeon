import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags, userMention } from 'discord.js'

const command = {
  data: new SlashCommandBuilder().setName('join-secret-santa').setDescription('Join the Secret Santa!'),
  async execute(interaction: ChatInputCommandInteraction) {
    try {
      await interaction.reply({
        content: 'You are too late to join the Secret Santa! <:leaf_helper:1433816388497309696>',
        flags: MessageFlags.Ephemeral,
      })
    } catch (e) {
      console.log(`Interaction error caused by: ${interaction.user.displayName}`)
      console.log(e)

      await interaction.reply({
        content: `There was an error joining the Secret Santa! Feel free to try again even though the entry period has ended, and/or poke my overlord ${userMention('109707866629246976')}.`,
        flags: MessageFlags.Ephemeral,
      })
    }
  },
}

export default command
