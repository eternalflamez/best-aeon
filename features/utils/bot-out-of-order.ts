import { Interaction, InteractionReplyOptions, MessageFlags } from 'discord.js'

export const BOT_OUT_OF_ORDER_MESSAGE = 'This bot is permanently out of order, sorry!'

export async function replyBotOutOfOrder(interaction: Interaction) {
  if (!interaction.isRepliable()) {
    return
  }

  const payload: InteractionReplyOptions = {
    content: BOT_OUT_OF_ORDER_MESSAGE,
    flags: MessageFlags.Ephemeral,
  }

  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload)
    } else {
      await interaction.reply(payload)
    }
  } catch {
    // Interaction may already be acknowledged or expired.
  }
}
