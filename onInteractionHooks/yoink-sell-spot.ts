import { Interaction, ButtonInteraction, userMention } from 'discord.js'

export default async function onYoinkSellSpot(interaction: Interaction) {
  const buttonInteraction = interaction as ButtonInteraction
  const message = buttonInteraction.message

  if (buttonInteraction.customId === 'yoink-sell-spot') {
    if (!message.content.includes('Yoinked by')) {
      await message.edit({
        content: `~~${message.content}~~\r\nYoinked by ${userMention(interaction.user.id)}`,
        components: [],
      })

      await buttonInteraction.reply({
        content: 'You yoinked! Make sure to react manually to the post with the coin!',
        ephemeral: true,
      })
    } else {
      await buttonInteraction.reply({
        content: 'It has already been yoinked. So close!',
        ephemeral: true,
      })
    }
  }
}
