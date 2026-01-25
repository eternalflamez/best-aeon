import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  InteractionContextType,
} from 'discord.js'
import dedent from 'dedent'

const command = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Start verification that you are in the ingame guild!'),
  async execute(interaction: ChatInputCommandInteraction) {
    try {
      const myScheduleButton = new ButtonBuilder()
        .setCustomId('verify-gw2-user')
        .setLabel('Verify')
        .setStyle(ButtonStyle.Primary)

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(myScheduleButton)

      const verificationReply = {
        content: dedent`Hey there! <:leaf_helper:1433816388497309696>

          Thanks for starting the verification process. Here's how it works:
          - Go to <https://account.arena.net/applications>
          - Create a New Key with ONLY the account permissions enabled
          - Give the key a name so you can see it's being used by me, like "LEAF verification"
          - Click on the verify button
          - Submit the key
          - Tadaa, you're all set`,
        components: [row],
      }

      if (interaction.context === InteractionContextType.BotDM) {
        await interaction.reply(verificationReply)
      } else {
        const message = await interaction.user.send(verificationReply)
        await interaction.reply({
          content: `[I sent you a DM with further instructions!](${message.url})`,
          flags: MessageFlags.Ephemeral,
        })
      }
    } catch (e) {
      await interaction.reply({
        content:
          "I couldn't DM you! Please double check your privacy settings. If that doesn't work, DM Sander (EternalFlamez.9025).",
        flags: MessageFlags.Ephemeral,
      })
    }
  },
}

export default command
