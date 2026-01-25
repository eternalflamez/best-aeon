import { CacheType, Interaction, LabelBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js'

export async function showVerifyAccountModal(interaction: Interaction<CacheType>): Promise<boolean> {
  if (!interaction.isButton()) {
    return false
  }

  let id = interaction.customId

  if (id !== 'verify-gw2-user') {
    return false
  }

  const modal = new ModalBuilder().setCustomId('verify-gw2-user-modal').setTitle('Verify')

  const input = new TextInputBuilder()
    .setCustomId('key')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Paste your API Key here')
    .setMinLength(72)
    .setMaxLength(72)
    .setRequired(true)

  const label = new LabelBuilder().setLabel('Paste your API Key here').setTextInputComponent(input)

  modal.addLabelComponents(label)

  await interaction.showModal(modal)

  return true
}
