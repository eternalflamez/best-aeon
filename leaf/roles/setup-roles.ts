import { Client, Events, GuildMember, TextChannel, userMention } from 'discord.js'
import cron from 'node-cron'

const SPROUTLING_ROLE = 'Sproutling'
const SALAD_ROLE = 'Salad'
const FRIEND_ROLE = 'Friend'
const SPROUTLING_DELAY = 5 * 60 * 1000 // 7 minutes
const SALAD_DELAY = 72 * 60 * 60 * 1000 // 72 hours
const CHANNEL = '1424725731208069152'

export default function (client: Client) {
  client.on(Events.GuildMemberAdd, async (member) => {
    addSproutlingRoleAfterDelay(member).catch((error) => {
      console.error(`Error in addSproutlingRoleAfterDelay for member ${member.user.tag}:`, error)
    })
  })

  // Check every hour
  cron.schedule('* * * * *', () => {
    try {
      checkSproutlingUsersOlderThan72Hours(client)
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
      return
    }

    const sproutlingRole = guild.roles.cache.find((role) => role.name === SPROUTLING_ROLE)
    const friendRole = guild.roles.cache.find((role) => role.name === FRIEND_ROLE)

    if (!sproutlingRole || !friendRole) {
      return
    }

    if (updatedMember.roles.cache.has(sproutlingRole.id) || updatedMember.roles.cache.has(friendRole.id)) {
      console.log('user has friend or sproutling already')
      return
    }

    await updatedMember.roles.add(sproutlingRole)
    const channel = guild.channels.cache.get(CHANNEL) as TextChannel
    channel.send(
      `${userMention(updatedMember.user.id)}, you are a Sproutling now! You'll grow into a Salad in 3 days! :partying_face:`,
    )
  } catch (error) {
    console.error(`Error adding Sproutling role to member ${member.user.tag}:`, error)
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
      `Congratulations, ${userMention(member.user.id)}! You are a fully grown Salad now! :four_leaf_clover: Keep it fresh!`,
    )
  } catch (error) {
    console.error(`Error updating ${member.user.tag} from Sproutling to Salad:`, error)
  }
}
