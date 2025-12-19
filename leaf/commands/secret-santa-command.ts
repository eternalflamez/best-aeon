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
  data: new SlashCommandBuilder()
    .setName('secret-santa')
    .setDescription('Check the Secret Santa! Who are you sending to?'),
  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    try {
      let displayName: string = (interaction.member as GuildMember)?.displayName

      if (!displayName) {
        displayName =
          client.guilds.cache.get('798151793577558037')?.members.cache.get(interaction.user.id)?.displayName ||
          interaction.user.displayName
      }

      const userInfo = await leafDb?.collection('santas').doc(interaction.user.id).get()
      const data = userInfo?.data()

      if (!userInfo || !data) {
        await interaction.reply({
          content: "<:huh:1065613214513111061> You didn't sign up to the secret santa.",
          flags: MessageFlags.Ephemeral,
        })
        return
      }

      await interaction.reply({
        content: `You're the Secret Santa of ${userMention(data.receiver)}! <:leaf_helper:1433816388497309696>`,
        flags: MessageFlags.Ephemeral,
      })
    } catch (e) {
      console.log(`secret-santa Interaction error caused by: ${interaction.user.displayName}`)
      console.log(e)

      await interaction.reply({
        content: `There was an error reading who you're Secret Santa of! Feel free to try again, and/or poke my overlord ${userMention('109707866629246976')}.`,
        flags: MessageFlags.Ephemeral,
      })
    }
  },
}

export default command
