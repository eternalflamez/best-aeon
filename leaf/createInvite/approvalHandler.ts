import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  Client,
  EmbedBuilder,
  Events,
  MessageFlags,
  TextChannel,
  userMention,
} from 'discord.js'

import { COLORS } from '../constants/colors'
import leafDb from '../leaf-firestore'
import dedent from 'dedent'
import { NewUserSignup } from './interfaces/newUserSignup'

export function setupApprovalHandler(client: Client) {
  if (process.env.ENVIRONMENT === 'production') {
    return
  }

  client.on(Events.GuildMemberAdd, async (member) => {
    const previousInvites = [...member.guild.invites.cache.values()]
    const currentInvites = await member.guild.invites.fetch()
    const deletedInvites = previousInvites.filter((prev) => !currentInvites.has(prev.code))

    let inviteCode: string | undefined = undefined

    if (deletedInvites.length > 0) {
      inviteCode = deletedInvites[0].code
    } else {
      const newUserRef = await leafDb
        ?.collection('signups')
        .where('discordName', '==', member.user.globalName)
        .limit(1)
        .get()
      const data = newUserRef?.docs.shift()?.data() as undefined | NewUserSignup

      if (data) {
        inviteCode = data.inviteCode
      }
    }

    if (inviteCode) {
      await sendDiscordMessage(member.id, inviteCode).catch((error) => {
        console.log(`Failed to send signup for ${inviteCode}`, error)
      })
    } else {
      const channel = await getLeafChannel()

      if (!channel) {
        return
      }

      channel.send(`User ${userMention(member.id)} joined, but I couldn't find an application for them.`)
    }
  })

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isButton()) {
      return
    }

    try {
      const parsed = parseApprovalButtonId(interaction.customId)
      if (!parsed) return

      if (parsed.action === 'reject') {
        await rejectApplication(parsed.inviteCode, interaction)
      } else if (parsed.action === 'approve') {
        await approveApplication(parsed.inviteCode, interaction)
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

  async function getLeafChannel(): Promise<TextChannel | undefined> {
    let channel

    try {
      channel = await client.channels.fetch(process.env.LEAF_GUILD_NEW_USER_CHANNEL!)
    } catch {
      console.log('No access to the new signups channel!')
    }

    if (!channel || !(channel instanceof TextChannel)) {
      console.error('Approval Handler: No channel to send to')
      return undefined
    }

    return channel
  }

  async function sendDiscordMessage(discordId: string, inviteCode: string) {
    const channel = await getLeafChannel()

    if (!channel) {
      return
    }

    const newUserRef = await getUserSignup(inviteCode)

    if (!newUserRef) {
      console.log('Could not find approval in firestore for ', inviteCode)
      return
    }

    await newUserRef.ref.update({
      discordId,
      joinedTimestamp: Date.now(),
    })

    const newUser = newUserRef.data() as NewUserSignup

    const approvalRow = createApprovalButtons({ inviteCode })

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

  async function rejectApplication(inviteCode: string, interaction: ButtonInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })

    const signup = await updateApprovalInFirestore(interaction.user.displayName, inviteCode, false)

    await markInteractionMessage(interaction, {
      action: 'REJECTED',
      color: COLORS.negative,
    })

    const discordId = (signup.data() as Partial<NewUserSignup> | undefined)?.discordId
    if (!discordId) {
      await interaction.editReply(`There was an issue rejecting this user. Poke Sander, this is the id: ${signup.id}`)
      return
    }

    const targetUser = await getUserById(discordId)
    if (!targetUser) {
      await interaction.editReply('I saved your rejection, but the user is no longer available to DM.')
      return
    }

    try {
      await targetUser.send('After careful consideration, we have chosen to reject your application. Byebye!')
      await interaction.editReply(`Successfully rejected ${targetUser.displayName}.`)
    } catch (e) {
      console.error(e)
      await interaction.editReply(`There was an issue rejecting this user. Poke Sander, this is the id: ${signup.id}`)
    }
  }

  async function approveApplication(inviteCode: string, interaction: ButtonInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })

    const signup = await updateApprovalInFirestore(interaction.user.displayName, inviteCode, true)

    await markInteractionMessage(interaction, {
      action: 'APPROVED',
      color: COLORS.positive,
    })

    const discordId = (signup.data() as Partial<NewUserSignup> | undefined)?.discordId
    if (!discordId) {
      await interaction.editReply(`There was an issue approving this user. Poke Sander, this is the id: ${signup.id}`)
      return
    }

    const targetUser = await getUserById(discordId)
    if (!targetUser) {
      await interaction.editReply('I saved your rejection, but the user is no longer available to DM.')
      return
    }

    try {
      await targetUser.send('After careful consideration, we have chosen to approve your application. Welcome!')
      await interaction.editReply(
        `Successfully approved ${targetUser.displayName}. I've sent them a message to verify.`,
      )
    } catch (e) {
      console.error(e)
      await interaction.editReply(`There was an issue approving this user. Poke Sander, this is the id: ${signup.id}`)
    }
  }

  async function updateApprovalInFirestore(interactorId: string, inviteCode: string, approved: boolean) {
    const newUserRef = await getUserSignup(inviteCode)

    if (!newUserRef) {
      throw new Error(`Could not find signup in the database for inviteCode=${inviteCode}`)
    }

    await newUserRef.ref.update({
      approvedBy: interactorId,
      approved,
    })

    return newUserRef
  }

  async function getUserSignup(inviteCode: string): Promise<FirebaseFirestore.QueryDocumentSnapshot | undefined> {
    const newUserRef = await leafDb?.collection('signups').where('inviteCode', '==', inviteCode).limit(1).get()

    return newUserRef?.docs.shift()
  }

  async function markInteractionMessage(
    interaction: ButtonInteraction,
    options: { action: 'APPROVED' | 'REJECTED'; color: number },
  ) {
    const originalEmbed = interaction.message.embeds[0]
    const updatedEmbed = EmbedBuilder.from(originalEmbed).setColor(options.color)

    if (originalEmbed?.description) {
      updatedEmbed.setDescription(
        `${options.action} BY ${userMention(interaction.user.id)}: \n${originalEmbed.description}`,
      )
    }

    await interaction.message.edit({
      embeds: [updatedEmbed],
      components: [createApprovalButtons({ disabled: true })],
    })
  }

  function parseApprovalButtonId(customId: string): { action: 'approve' | 'reject'; inviteCode: string } | undefined {
    // Custom id format: `<action>Application_<inviteCode>`
    if (customId.startsWith('rejectApplication_')) {
      return { action: 'reject', inviteCode: customId.split('_').slice(1).join('_') }
    }
    if (customId.startsWith('approveApplication_')) {
      return { action: 'approve', inviteCode: customId.split('_').slice(1).join('_') }
    }
    return undefined
  }

  async function getUserById(discordId: string) {
    try {
      return await client.users.fetch(discordId)
    } catch {
      return undefined
    }
  }
}

function createApprovalButtons(options: { inviteCode?: string; disabled?: boolean } = {}) {
  const rejectButton = new ButtonBuilder()
    .setCustomId(`rejectApplication_${options.inviteCode}`)
    .setLabel('Reject')
    .setStyle(ButtonStyle.Danger)
    .setDisabled(!!options.disabled)

  const approveButton = new ButtonBuilder()
    .setCustomId(`approveApplication_${options.inviteCode}`)
    .setLabel('Approve')
    .setStyle(ButtonStyle.Success)
    .setDisabled(!!options.disabled)

  return new ActionRowBuilder<ButtonBuilder>().addComponents(rejectButton, approveButton)
}
