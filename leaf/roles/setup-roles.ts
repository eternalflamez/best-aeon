import { Client, Events, GuildMember, TextChannel, userMention } from 'discord.js'
import cron from 'node-cron'
import leafDb from '../leaf-firestore'
import dedent from 'dedent'
import { getLeafCouncillorChannel } from '../createInvite/approvalHandler'
import { NewUserSignup } from '../createInvite/interfaces/newUserSignup'
import { RegisteredUser } from '../createInvite/interfaces/registeredUser'

const SEEDLING_ROLE = 'Seedling'
const SPROUTLING_ROLE = 'Sproutling'
const SALAD_ROLE = 'Salad'
const FRIEND_ROLE = 'Friend'
const SEEDLING_DELAY = 5 * 60 * 1000 // 5 minutes
const SALAD_DELAY = 72 * 60 * 60 * 1000 // 72 hours
const KICK_DELAY = 144 * 60 * 60 * 1000 // 144 hours (6 days)
const CHANNEL = '943535715319443526' // LEAF #welcome

export async function setupRoles(client: Client) {
  client.on(Events.GuildMemberAdd, async (member) => {
    await addSeedlingRole(member).catch((error) => {
      console.error(`Error in addSeedlingRole for member ${member.user.tag}:`, error)
    })
  })

  await checkSproutlingUsersOlderThan72Hours(client)
  await checkPendingOnboarding(client)

  // Check every hour
  cron.schedule('0 * * * *', async () => {
    try {
      await checkSproutlingUsersOlderThan72Hours(client)
      await checkPendingOnboarding(client)
    } catch (e) {
      console.error('Error in hourly Sproutling check:', e)
    }
  })
}

async function addSeedlingRole(member: GuildMember): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, SEEDLING_DELAY))

  await addRole(member, SEEDLING_ROLE)
}

export async function addSproutlingRole(member: GuildMember): Promise<void> {
  const success = await addRole(member, SPROUTLING_ROLE)

  if (!success) {
    return
  }

  const oldRole = member.guild.roles.cache.find((role) => role.name === SEEDLING_ROLE)

  if (!oldRole) {
    console.log('Missing seedling role')
    return
  }

  await member.roles.remove(oldRole)

  const channel = member.guild.channels.cache.get(CHANNEL) as TextChannel
  await channel.send(
    `${userMention(member.user.id)}, welcome to [LEAF] guild! You are a Sproutling now! You'll grow into a Salad in 3 days! <a:salad_dealwithit:1436466486712471603>`,
  )
}

async function addRole(member: GuildMember, roleName: string): Promise<boolean> {
  if (member.user.bot) {
    return false
  }

  try {
    const guild = member.guild
    const updatedMember = await guild.members.fetch(member.id)

    if (!updatedMember) {
      console.log(`Member not found for ${member.user.tag}`)
      return false
    }

    const role = guild.roles.cache.find((role) => role.name === roleName)
    const friendRole = guild.roles.cache.find((role) => role.name === FRIEND_ROLE)

    if (!role || !friendRole) {
      console.log(`${roleName} or Friend role not found`)
      return false
    }

    if (updatedMember.roles.cache.has(role.id) || updatedMember.roles.cache.has(friendRole.id)) {
      console.log(`${member.user.tag} has Friend or ${roleName} already`)
      return false
    }

    await updatedMember.roles.add(role)

    return true
  } catch (error) {
    console.error(`Error adding ${roleName} role to member ${member.user.tag}`)
    return false
  }
}

async function checkSproutlingUsersOlderThan72Hours(client: Client): Promise<void> {
  const guilds = client.guilds.cache

  for (const [_, guild] of guilds) {
    try {
      const sproutlingRole = guild.roles.cache.find((role) => role.name === SPROUTLING_ROLE)

      if (!sproutlingRole) {
        continue
      }

      const now = Date.now()
      const seventyTwoHoursAgo = now - SALAD_DELAY

      const eligibleMembers = sproutlingRole.members.filter((member) => {
        return member.roles.cache.has(sproutlingRole.id) && !member.user.bot
      })

      for (const [_, member] of eligibleMembers) {
        const registeredAt = await getRegistrationTimestamp(member.id)
        if (registeredAt && registeredAt < seventyTwoHoursAgo) {
          await updateSproutlingToSalad(member)
        }
      }
    } catch (guildError) {
      console.error(`Error processing sproutling check in guild ${guild.name}:`, guildError)
    }
  }
}

async function checkPendingOnboarding(client: Client): Promise<void> {
  const now = Date.now()
  const remindBefore = now - SALAD_DELAY
  const kickBefore = now - KICK_DELAY

  await remindOrKickApprovedNotRegistered(client, { remindBefore, kickBefore })
  await remindOrKickRegisteredNotInGuild(client, { remindBefore, kickBefore })
}

async function remindOrKickApprovedNotRegistered(
  client: Client,
  windows: { remindBefore: number; kickBefore: number },
): Promise<void> {
  try {
    const signups = await leafDb
      ?.collection('signups')
      .where('approved', '==', true)
      .where('registered', '!=', true)
      .get()

    if (!signups) {
      return
    }

    for (const doc of signups.docs) {
      const data = doc.data() as NewUserSignup
      const discordId = data.discordId

      if (!discordId) {
        continue
      }

      const approvedAt = data.approvedTimestamp ?? undefined

      if (!approvedAt) {
        continue
      }

      if (approvedAt < windows.kickBefore) {
        await kickMemberAndNotifyCouncil(client, discordId, 'Did not register GW2 API')
        continue
      }

      if (approvedAt < windows.remindBefore) {
        await sendReminderDm(client, discordId, 'Did not register GW2 API')
      }
    }
  } catch (e) {
    console.error('Error checking approved-but-not-registered users:', e)
  }
}

async function remindOrKickRegisteredNotInGuild(
  client: Client,
  windows: { remindBefore: number; kickBefore: number },
): Promise<void> {
  try {
    const regs = await leafDb?.collection('registrations').where('isGuildMember', '==', false).get()

    if (!regs) {
      return
    }

    for (const doc of regs.docs) {
      const data = doc.data() as Partial<RegisteredUser>
      const discordId = data.discordId

      if (!discordId || typeof data.timestamp !== 'number') {
        continue
      }

      if (data.timestamp < windows.kickBefore) {
        await kickMemberAndNotifyCouncil(client, discordId, 'Did not join ingame guild')
        continue
      }

      if (data.timestamp < windows.remindBefore) {
        await sendReminderDm(client, discordId, 'Did not join ingame guild')
      }
    }
  } catch (e) {
    console.error('Error checking registered-but-not-in-guild users:', e)
  }
}

async function sendReminderDm(client: Client, discordId: string, reason: KickReason) {
  try {
    const user = await client.users.fetch(discordId)
    const variableLine =
      reason === 'Did not register GW2 API'
        ? 'You still gotta do the API registration with me, otherwise we cannot proceed.'
        : 'You still gotta join the ingame guild, otherwise we cannot proceed.'

    await user.send(dedent`Hello, potential Salad!

      It has been 3 days since my Overlords approved your application form.

      ${variableLine}

      Please, do it within the next 3 days, otherwise I will have no choice but to do some weeding... :(`)
  } catch (e) {
    console.error(`Failed to send reminder DM to ${discordId}:`, e)
  }
}

async function kickMemberAndNotifyCouncil(client: Client, discordId: string, reason: KickReason) {
  const variableLine =
    reason === 'Did not register GW2 API'
      ? "You haven't registered your API key in the allotted time, so I am tasked with the depressing chore of weeding... :("
      : "You haven't joined the ingame guild in the allotted time, so I am tasked with the depressing chore of weeding... :("

  try {
    const user = await client.users.fetch(discordId)
    await user.send(dedent`Hello! Today, I am the bearer of sad news...

      ${variableLine}

      If by any chance this was a mistake, please fill in the form on the website (https://leafguild.lv/) again, and my Overlords will get to it asap.`)
  } catch (e) {
    console.error(`Failed to DM kick notice to ${discordId}:`, e)
  }

  try {
    const channel = await getLeafCouncillorChannel(client)
    if (!channel) {
      return
    }

    const role = channel.guild.roles.cache.find((role) => role.name.includes('Councillor Salad'))
    const mention = role ? `${userMention(discordId)} / <@&${role.id}>` : userMention(discordId)

    await channel.send(
      dedent`Hey Overlords${role ? ` / <@&${role.id}>` : ''}!

      I auto-kicked ${mention} because they didn't complete onboarding in time (${reason}).`,
    )
  } catch (e) {
    console.error('Failed to notify councillors about auto-kick:', e)
  }

  for (const [, guild] of client.guilds.cache) {
    try {
      const member = await guild.members.fetch(discordId).catch(() => undefined)
      if (!member) {
        continue
      }

      await member.kick(`Auto-kick: ${reason}`)
    } catch (e) {
      console.error(`Failed to kick ${discordId} in guild ${guild.name}:`, e)
    }
  }
}

async function getRegistrationTimestamp(discordId: string): Promise<number | undefined> {
  try {
    const doc = await leafDb?.collection('registrations').doc(discordId).get()
    const data = doc?.data() as RegisteredUser | undefined
    return data ? data.timestamp : undefined
  } catch (e) {
    console.error(`Failed to read registration for ${discordId}:`, e)
    return undefined
  }
}

async function updateSproutlingToSalad(member: GuildMember): Promise<void> {
  try {
    const guild = member.guild

    const sproutlingRole = guild.roles.cache.find((role) => role.name === SPROUTLING_ROLE)
    const saladRole = guild.roles.cache.find((role) => role.name === SALAD_ROLE)

    if (!sproutlingRole) {
      return
    }

    if (!saladRole) {
      return
    }

    if (!member.roles.cache.has(sproutlingRole.id)) {
      return
    }

    await member.roles.remove(sproutlingRole)
    await member.roles.add(saladRole)

    console.log(`Successfully updated ${member.user.tag} from Sproutling to Salad role`)
    const channel = guild.channels.cache.get(CHANNEL) as TextChannel
    channel.send(
      `Congratulations, ${userMention(member.user.id)}! You are a fully grown Salad now! Keep it fresh! <:salad_excited:1435673152016617572>`,
    )
  } catch (error) {
    console.error(`Error updating ${member.user.tag} from Sproutling to Salad:`, error)
  }
}

type KickReason = 'Did not register GW2 API' | 'Did not join ingame guild'
