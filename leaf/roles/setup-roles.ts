import { Client, Events, GuildMember, TextChannel, userMention } from 'discord.js'
import cron from 'node-cron'

const SPROUTLING_ROLE = 'Sproutling'
const SALAD_ROLE = 'Salad'
const FRIEND_ROLE = 'Friend'
const SPROUTLING_DELAY = 5 * 60 * 1000 // 7 minutes
const SALAD_DELAY = 72 * 60 * 60 * 1000 // 72 hours
const CHANNEL = '943535715319443526' // LEAF #welcome

export default async function (client: Client) {
  client.on(Events.GuildMemberAdd, async (member) => {
    await addSproutlingRoleAfterDelay(member).catch((error) => {
      console.error(`Error in addSproutlingRoleAfterDelay for member ${member.user.tag}:`, error)
    })
  })

  await checkSproutlingUsersOlderThan72Hours(client)

  // Check every hour
  cron.schedule('0 * * * *', async () => {
    try {
      await checkSproutlingUsersOlderThan72Hours(client)
    } catch (e) {
      console.error('Error in hourly Sproutling check:', e)
    }
  })
}

async function addSproutlingRoleAfterDelay(member: GuildMember): Promise<void> {
  if (member.user.bot) {
    return
  }

  await new Promise((resolve) => setTimeout(resolve, SPROUTLING_DELAY))

  try {
    const guild = member.guild
    const updatedMember = await guild.members.fetch(member.id)

    if (!updatedMember) {
      console.log(`Member not found for ${member.user.tag}`)
      return
    }

    const sproutlingRole = guild.roles.cache.find((role) => role.name === SPROUTLING_ROLE)
    const friendRole = guild.roles.cache.find((role) => role.name === FRIEND_ROLE)

    if (!sproutlingRole || !friendRole) {
      console.log('Sproutling or Friend role not found')
      return
    }

    if (updatedMember.roles.cache.has(sproutlingRole.id) || updatedMember.roles.cache.has(friendRole.id)) {
      console.log('user has friend or sproutling already')
      return
    }

    await updatedMember.roles.add(sproutlingRole)
    const channel = guild.channels.cache.get(CHANNEL) as TextChannel
    channel.send(
      `${userMention(updatedMember.user.id)}, welcome to [LEAF] guild! You are a Sproutling now! You'll grow into a Salad in 3 days! <a:salad_dealwithit:1094446233789140994>`,
    )
  } catch (error) {
    console.error(`Error adding Sproutling role to member ${member.user.tag}:`, error)
  }
}

async function checkSproutlingUsersOlderThan72Hours(client: Client): Promise<void> {
  const guilds = client.guilds.cache

  for (const [_, guild] of guilds) {
    try {
      // Load guild members so that the cache hit works.
      await guild.members.fetch()

      const sproutlingRole = guild.roles.cache.find((role) => role.name === SPROUTLING_ROLE)

      if (!sproutlingRole) {
        continue
      }

      const now = Date.now()
      const seventyTwoHoursAgo = now - SALAD_DELAY

      const eligibleMembers = sproutlingRole.members.filter((member) => {
        return (
          member.roles.cache.has(sproutlingRole.id) &&
          member.joinedTimestamp &&
          member.joinedTimestamp < seventyTwoHoursAgo
        )
      })

      for (const [_, member] of eligibleMembers) {
        await updateSproutlingToSalad(member)
      }
    } catch (guildError) {
      console.error(`Error processing sproutling check in guild ${guild.name}:`, guildError)
    }
  }
}

async function updateSproutlingToSalad(member: GuildMember): Promise<void> {
  try {
    const guild = member.guild

    const sproutlingRole = guild.roles.cache.find((role) => role.name === SPROUTLING_ROLE)
    const saladRole = guild.roles.cache.find((role) => role.name === SALAD_ROLE)

    if (!sproutlingRole) {
      console.log(`Sproutling role not found for ${member.user.tag}`)
      return
    }

    if (!saladRole) {
      console.log(`Salad role not found for ${member.user.tag}`)
      return
    }

    if (!member.roles.cache.has(sproutlingRole.id)) {
      console.log(`${member.user.tag} does not have the Sproutling role`)
      return
    }

    await member.roles.remove(sproutlingRole)
    await member.roles.add(saladRole)

    console.log(`Successfully updated ${member.user.tag} from Sproutling to Salad role`)
    const channel = guild.channels.cache.get(CHANNEL) as TextChannel
    channel.send(
      `Congratulations, ${userMention(member.user.id)}! You are a fully grown Salad now! Keep it fresh! <a:salad_happy:1094446068596490360>`,
    )
  } catch (error) {
    console.error(`Error updating ${member.user.tag} from Sproutling to Salad:`, error)
  }
}
