import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
  GuildMember,
  userMention,
  Client,
} from 'discord.js'
import leafDb from '../leaf-firestore.ts'

const command = {
  data: new SlashCommandBuilder().setName('join-secret-santa').setDescription('Join the Secret Santa!'),
  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    try {
      let displayName: string = (interaction.member as GuildMember)?.displayName

      if (!displayName) {
        displayName =
          client.guilds.cache.get('798151793577558037')?.members.cache.get(interaction.user.id)?.displayName ||
          interaction.user.displayName
      }

      await leafDb?.collection('santas').doc(interaction.user.id).set({
        id: interaction.user.id,
        display: displayName,
      })

      await interaction.reply({
        content:
          "You succesfully joined the Secret Santa! <:leaf_helper:1433816388497309696> I will DM you with info on who you're paired with when we start!",
        flags: MessageFlags.Ephemeral,
      })
    } catch (e) {
      console.log(`Interaction error caused by: ${interaction.user.displayName}`)
      console.log(e)

      await interaction.reply({
        content: `There was an error joining the Secret Santa! Feel free to try again, and/or poke my overlord ${userMention('109707866629246976')}.`,
        flags: MessageFlags.Ephemeral,
      })
    }
  },
}

export default command
