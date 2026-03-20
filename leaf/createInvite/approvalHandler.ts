import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  Client,
  EmbedBuilder,
  Events,
  MessageFlags,
  userMention,
} from 'discord.js'

import { COLORS } from '../constants/colors'
import leafDb from '../leaf-firestore'

export function setupApprovalHandler(client: Client) {
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isButton()) {
      return
    }

    try {
      const customId = interaction.customId
      const target = interaction.customId.split('_').slice(1).join('_')

      if (customId.startsWith('rejectApplication')) {
        await rejectApplication(interaction)
        await updateApprovalInFirestore(interaction.user.displayName, target, false)
      } else if (customId.startsWith('approveApplication')) {
        await approveApplication(interaction)
        await updateApprovalInFirestore(interaction.user.displayName, target, true)
      }
    } catch (e: any) {
      console.error(e.rawError?.message || 'Something went wrong?')
      console.error(e)

      try {
        await interaction.reply({
          content: 'Something went wrong. Please try again or contact Sander.',
          flags: MessageFlags.Ephemeral,
        })
        return
      } catch {
        console.error('--- ERROR: Was not allowed to reply to interaction ---')
      }
    }
  })
}

export function createApprovalButtons(options: { userId?: string; disabled?: boolean } = {}) {
  const rejectButton = new ButtonBuilder()
    .setCustomId(`rejectApplication_${options.userId}`)
    .setLabel('Reject')
    .setStyle(ButtonStyle.Danger)
    .setDisabled(!!options.disabled)

  const approveButton = new ButtonBuilder()
    .setCustomId(`approveApplication_${options.userId}`)
    .setLabel('Approve')
    .setStyle(ButtonStyle.Success)
    .setDisabled(!!options.disabled)

  return new ActionRowBuilder<ButtonBuilder>().addComponents(rejectButton, approveButton)
}

async function rejectApplication(interaction: ButtonInteraction) {
  const originalEmbed = interaction.message.embeds[0]

  const updatedEmbed = EmbedBuilder.from(originalEmbed)
  updatedEmbed.setColor(COLORS.negative)

  if (originalEmbed.description) {
    updatedEmbed.setDescription(`REJECTED BY ${userMention(interaction.user.id)}: \n${originalEmbed.description}`)
  }

  await interaction.update({
    embeds: [updatedEmbed],
    components: [createApprovalButtons({ disabled: true })],
  })
}

async function approveApplication(interaction: ButtonInteraction) {
  const originalEmbed = interaction.message.embeds[0]

  const updatedEmbed = EmbedBuilder.from(originalEmbed)
  updatedEmbed.setColor(COLORS.positive)

  if (originalEmbed.description) {
    updatedEmbed.setDescription(`APPROVED BY ${userMention(interaction.user.id)}: \n${originalEmbed.description}`)
  }

  await interaction.update({
    embeds: [updatedEmbed],
    components: [createApprovalButtons({ disabled: true })],
  })
}

async function updateApprovalInFirestore(interactorId: string, docName: string, approved: boolean) {
  await leafDb?.collection('signups').doc(docName)?.update({
    approvedBy: interactorId,
    approved,
  })
}
