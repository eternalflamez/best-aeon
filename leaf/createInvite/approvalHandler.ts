import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  Client,
  EmbedBuilder,
  Events,
  GuildMember,
  MessageFlags,
  TextChannel,
  userMention,
} from 'discord.js'

import { COLORS } from '../constants/colors'
import leafDb from '../leaf-firestore'
import dedent from 'dedent'
import { NewUserSignup } from './interfaces/newUserSignup'

export function setupApprovalHandler(client: Client) {
  client.on(Events.GuildMemberAdd, async (member) => {
    const previousInvites = [...member.guild.invites.cache.values()]
    const currentInvites = await member.guild.invites.fetch()
    const deletedInvites = previousInvites.filter((prev) => !currentInvites.has(prev.code))

    if (deletedInvites.length > 0) {
      const invite = deletedInvites[0]

      await sendDiscordMessage(invite.code).catch((error) => {
        console.log(`Failed to send signup for ${invite.code}`, error)
      })
    }
  })

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

  async function sendDiscordMessage(inviteCode: string) {
    let channel

    try {
      channel = await client.channels.fetch(process.env.LEAF_GUILD_NEW_USER_CHANNEL!)
    } catch {
      console.log('No access to the new signups channel!')
    }

    if (!channel || !(channel instanceof TextChannel)) {
      return
    }

    const newUser = ((await getUserSignup(inviteCode))?.data() ?? null) as NewUserSignup | null

    if (!newUser) {
      return
    }

    const approvalRow = createApprovalButtons({ userId: inviteCode })

    await channel.send({
      components: [approvalRow],
      embeds: [
        {
          color: COLORS.neutral,
          title: `<:leaf_helper:1433816388497309696> ${newUser.nickname} just filled in the form to join!`,
          description: dedent`\`\`\`ansi
        THE FORM:

        [2;36mYour name / nickname:[0m
        ${newUser.nickname}
        [2;36mDiscord handle:[0m
        ${newUser.discordName}
        [2;36mGW2 handle:[0m
        ${newUser.gw2Name}
        [2;36mWe are an 18+ guild, therefore we'd like to know your age, please (age will be kept confidential)![0m
        ${newUser.age}
        [2;36mAny particular reason you wanna join LEAF?[0m
        ${newUser.joinReason}
        [2;36mHow into Fashion Wars 2 are you?[0m
        ${newUser.fashionWars}
        [2;36mWhat is your favourite thing to do on GW2?[0m
        ${newUser.favoriteActivity}
        [2;36mWho is your favourite GW2 story NPC and why?[0m
        ${newUser.favoriteNpc}
        \`\`\``,
          timestamp: new Date().toISOString(),
        },
      ],
    })
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

  async function updateApprovalInFirestore(interactorId: string, inviteCode: string, approved: boolean) {
    const newUserRef = await getUserSignup(inviteCode)

    if (!newUserRef) {
      console.log('Could not find approval in firestore for ', inviteCode)
      return
    }

    await newUserRef.ref.update({
      approvedBy: interactorId,
      approved,
    })
  }

  async function getUserSignup(inviteCode: string): Promise<FirebaseFirestore.QueryDocumentSnapshot | undefined> {
    const newUserRef = await leafDb?.collection('signups').where('inviteCode', '==', inviteCode).limit(1).get()

    return newUserRef?.docs.shift()
  }
}

function createApprovalButtons(options: { userId?: string; disabled?: boolean } = {}) {
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
