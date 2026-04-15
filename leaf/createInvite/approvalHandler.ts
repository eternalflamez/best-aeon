import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  Client,
  EmbedBuilder,
  Events,
  MessageFlags,
  roleMention,
  TextChannel,
  userMention,
} from 'discord.js'

import { COLORS } from '../constants/colors'
import leafDb from '../leaf-firestore'
import dedent from 'dedent'
import { NewUserSignup } from './interfaces/newUserSignup'
import { showVerifyAccountModal } from './register-account/show-register-account-modal'
import { registerAccount } from './register-account/register-account'

export function setupApprovalHandler(client: Client) {
  if (process.env.ENVIRONMENT === 'production') {
    return
  }

  client.on(Events.GuildMemberAdd, async (member) => {
    try {
      const previousInvites = [...member.guild.invites.cache.values()]
      const currentInvites = await member.guild.invites.fetch()
      const deletedInvites = previousInvites.filter((prev) => !currentInvites.has(prev.code))

      let inviteCode: string | undefined = undefined

      if (deletedInvites.length > 0) {
        inviteCode = deletedInvites[0].code
      } else {
        const newUserRef = await leafDb
          ?.collection('signups')
          .where('discordName', '==', member.user.username)
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
        const channel = await getLeafCouncillorChannel(client)

        if (!channel) {
          return
        }

        const role = channel.guild.roles.cache.find((role) => role.name.includes('Councillor Salad'))

        await channel.send(dedent`Hey, magnifent Overlords${role ? ` / ${roleMention(role.id)}` : ''}!
          
          User ${userMention(member.id)} joined, but I couldn't find an application for them.`)
      }

      await member.send(dedent`Hello! I am the very helpful LEAF Helper! <:leaf_helper:1433816388497309696>

      Your filled form has been sent to my Overlords, and they will get back to you asap!
      
      Meanwhile, you have been given the Seedling role - no worries, soon you'll be a proper Salad! :3`)
    } catch (e) {
      console.error('Error in GuildMemberAdd of approvalHandler')
      console.error(e)
    }
  })

  client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isButton()) {
      try {
        const parsed = parseApprovalButtonId(interaction.customId)

        if (parsed) {
          if (parsed.action === 'reject') {
            await rejectApplication(parsed.inviteCode, interaction)
          } else if (parsed.action === 'approve') {
            await approveApplication(parsed.inviteCode, interaction)
          }
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
    }

    try {
      if (await showVerifyAccountModal(interaction)) {
        return
      }

      if (await registerAccount(interaction)) {
        return
      }
    } catch (error) {
      console.error('error in leaf bot interaction')
      console.error(error)
    }
  })

  async function sendDiscordMessage(discordId: string, inviteCode: string) {
    const channel = await getLeafCouncillorChannel(client)

    if (!channel) {
      return
    }

    const newUserRef = await getUserSignup(inviteCode)

    if (!newUserRef) {
      console.log('Could not find approval in database for ', inviteCode)
      return
    }

    await newUserRef.ref.update({
      discordId,
    } as Partial<NewUserSignup>)

    const newUser = newUserRef.data() as NewUserSignup

    const approvalRow = createApprovalButtons({ inviteCode })

    const role = channel.guild.roles.cache.find((role) => role.name.includes('Councillor Salad'))

    await channel.send({
      content: `Hey, magnificent Overlords${role ? ` / ${roleMention(role.id)}` : ''}! <:leaf_helper:1433816388497309696>`,
      components: [approvalRow],
      embeds: [
        {
          color: COLORS.neutral,
          title: `${newUser.nickname} just filled in the form to join! Check it out at your earliest convenience!`,
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
      await targetUser.send(dedent`Hello! Today, I am the bearer of sad news...
        
        My Overlords have unfortunately denied your application - it seems we would not be a good fit.
        
        We wish you the best of luck in further roaming amongst the the Tyrian heroes!`)
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
      const registerButton = new ButtonBuilder()
        .setCustomId('register-gw2-user')
        .setLabel('Register')
        .setStyle(ButtonStyle.Primary)

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(registerButton)

      await targetUser.send(dedent`Hey there! I have great news - you are about to become a part of LEAF!

        The next step is to complete the API registration process.
        
        Why do my Overlords need it? So I can help them manage the guild members as the helpful LEAF Helper I am. <:leaf_helper:1433816388497309696>`)
      await targetUser.send({
        content: dedent.withOptions({ alignValues: true })`Here's how it works:
          1) Go to https://account.arena.net/applications.
          2) Create a New Key with ONLY the account permissions enabled.
          3) Give the key a name so you can distinguish that it's being used by me - something like "LEAF guild" (and you have to have it active while you are in the guild).
          4) Click on the "Register" button below.
          5) Submit the key you just created to me!
        Tadaa, you're all set!`,
        components: [row],
      })

      await interaction.editReply(`Successfully approved ${targetUser.displayName}. I've sent them a message!`)
    } catch (e) {
      console.error(e)
      await interaction.editReply(
        `There was an issue approving ${targetUser.displayName}. Poke Sander, this is the id: ${signup.id}`,
      )
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
      approvedTimestamp: Date.now(),
    } as Partial<NewUserSignup>)

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

export async function getLeafCouncillorChannel(client: Client): Promise<TextChannel | undefined> {
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
