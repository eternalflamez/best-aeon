import { Client } from 'discord.js'
import { GenerateContentResponse, GoogleGenAI, HarmBlockThreshold, HarmCategory, PartUnion } from '@google/genai'
import db from '../../firestore/setupFirestore'
import { HelloIAmSample, WrapUserDoc } from './rewind-types'

const DEFAULT_GUILD_ID = '1503815804142223420'
const COMPLAIN_CHANNEL = 'https://discord.com/channels/1503815804142223420/1503815804955787495'

export type SendRewindOptions = {
  year: number
  guildId?: string
  send?: boolean
}

function percentile(list: number[], value: number) {
  if (list.length <= 1) {
    return 0
  }
  return Math.floor(((list.filter((v) => v <= value).length - 1) / (list.length - 1)) * 100)
}

function formatFastest(ms: number) {
  if (ms > 3000) {
    return `${Math.round(ms / 1000)} seconds`
  }
  return `${ms}ms`
}

export async function sendRewind(client: Client, options: SendRewindOptions) {
  if (!db) {
    console.error('Firestore not initialized')
    return
  }

  const guildId = options.guildId ?? DEFAULT_GUILD_ID
  const guild = client.guilds.cache.get(guildId)
  if (!guild) {
    console.error(`Guild ${guildId} not found in cache`)
    return
  }

  const usersSnap = await db.collection('wrapped').doc(String(options.year)).collection('users').get()
  const allUsersRaw: WrapUserDoc[] = usersSnap.docs.map((d) => ({ ...(d.data() as WrapUserDoc), id: d.id }))

  await guild.members.fetch()
  const allUsers = allUsersRaw.filter((u) => guild.members.cache.has(u.id))

  const helloSnaps = await Promise.all(
    allUsers.map(async (user) => {
      const collection = await db!
        .collection('wrapped')
        .doc(String(options.year))
        .collection('users')
        .doc(user.id)
        .collection('helloIAm')
        .get()

      return {
        id: user.id,
        samples: collection.docs.map((d) => d.data() as HelloIAmSample),
        size: collection.size,
      }
    }),
  )

  const pingCounts = allUsers.map((u) => u.herbert?.pings || 0)
  const dadCounts = allUsers.map((u) => u.helloIAmCount || helloSnaps.find((h) => h.id === u.id)?.size || 0)
  const createdSignupsCount = allUsers.map((u) => u.sells?.posted || 0).filter((n) => n !== 0)
  const signupParticipationCounts = allUsers
    .map((u) => u.sells?.signedUp || 0)
    .filter((n) => n > 0)

  const dibsLeaderboard = allUsers
    .filter((u) => u.dibs?.fastestMs != null)
    .map((u) => [u.id, u.dibs!.fastestMs!] as const)
    .sort((a, b) => a[1] - b[1])

  console.log(`Year ${options.year}: ${allUsers.length} guild member(s) with wrap data`)
  console.log(options.send ? 'SEND mode — DMing users' : 'DRY-RUN — pass --send to DM')

  let currentUserIndex = 0

  for (const userData of allUsers) {
    const member = await guild.members.fetch(userData.id).catch(() => null)
    if (!member) {
      continue
    }

    const discordUser = await client.users.fetch(userData.id).catch(() => null)
    if (!discordUser) {
      continue
    }

    currentUserIndex++

    const helloSnap = helloSnaps.find((v) => v.id === userData.id)
    const helloItems = helloSnap?.samples || []

    const pingCount = userData.herbert?.pings || 0
    const cooldownCount = userData.herbert?.cooldowns || 0
    const errorCount = userData.herbert?.errors || 0
    const banCount = userData.herbert?.blockDesire || 0

    const helloCount = userData.helloIAmCount || helloItems.length || 0
    const createdSignups = userData.sells?.posted || 0
    const signupChecks = userData.sells?.myScheduleClicks || 0
    const emptySignupChecks = userData.sells?.emptyMySchedule || 0
    const signupParticipationCount = userData.sells?.signedUp || 0
    const dibsCount = userData.dibs?.count || 0
    const fastestMs = userData.dibs?.fastestMs

    const pingPercent = percentile(pingCounts, pingCount)
    const dadPercent = percentile(dadCounts, helloCount)
    const createdSignupPercent = createdSignups > 0 ? percentile(createdSignupsCount, createdSignups) : 0
    const signupPercent =
      signupParticipationCount > 0 ? percentile(signupParticipationCounts, signupParticipationCount) : 0

    const shuffledHello = [...helloItems].sort(() => 0.5 - Math.random())
    const topDadTriggers = shuffledHello
      .slice(0, 3)
      .map((i) => `- ${i.textTrigger}`)
      .join('\n')

    const emojiList = Object.entries(userData.emotes || {})
      .sort((a, b) => b[1] - a[1])
      .map(([emoji, count]) => `- ${emoji}: ${count}`)
      .join('\n')

    const lines: string[] = []

    lines.push(`**Welcome to your Je Wrapped, ${member.displayName}**`)
    lines.push(`Let's look at how much you sucked this year.`)

    lines.push(`\n<:bestaeon:1442145000589889688> **Abuse Summary**`)
    lines.push(`- You pinged me **${pingCount}** times.`)
    lines.push(`- Cooldowns triggered: **${cooldownCount}**`)
    lines.push(`- Errors you caused: **${errorCount}**`)
    lines.push(`- Times I wanted to blocked you: **${banCount}**`)
    if (pingCount > 0) {
      lines.push(`You used me more than **${pingPercent}%** of users.`)
    }

    lines.push(`\n📅 **Sells**`)
    lines.push(`- Sells you signed up for: **${signupParticipationCount}**`)
    lines.push(`- Sells you posted: **${createdSignups}**`)
    lines.push(`- Clicked My Schedule: **${signupChecks}** time(s)`)
    lines.push(`- How many times you found out you didn't even sign up to anything: **${emptySignupChecks}**`)
    if (signupParticipationCount > 0) {
      lines.push(`You participated in more sells than **${signupPercent}%** of users.`)
    }
    if (createdSignups > 0) {
      lines.push(`You posted more sells than **${createdSignupPercent}%** of users that posted sells.`)
    }

    lines.push(`\n<:MCMysticCoin:545057156274323486> **Signup emojis you used this year:**`)
    lines.push(emojiList || '- (none)')

    lines.push(`\n👋 **Hello I'm**`)
    lines.push(`You triggered this dad joke **${helloCount}** times.`)
    if (topDadTriggers.length) {
      lines.push(`Here's our top ${Math.min(3, shuffledHello.length)}:\n${topDadTriggers}`)
    }
    if (helloCount > 0) {
      lines.push(`You caused more dad jokes than **${dadPercent}%** of users.`)
    }

    if (dibsCount > 0 && fastestMs != null) {
      const userBestRank = dibsLeaderboard.findIndex(([uid]) => uid === userData.id) + 1

      lines.push(`\n☎️ **Customer Support**`)
      lines.push(`- You called dibs **${dibsCount}** times`)
      lines.push(
        `- Your fastest response time was **${formatFastest(fastestMs)}** — you're the **#${userBestRank}** fastest overall.`,
      )
    }

    let message = lines.join('\n')

    try {
      const chat = startChat()
      const parts = [{ text: message }] as PartUnion[]
      const geminiConclusion: GenerateContentResponse = await chat.sendMessage({ message: parts })
      if (geminiConclusion.text) {
        message += `\n\n${geminiConclusion.text}`
      }
    } catch (e) {
      console.error('Gemini conclusion failed', e)
    }

    message += `\n\n_If you didn't enjoy this, make sure to complain about it in_ ${COMPLAIN_CHANNEL}`

    console.log(`\n--- ${discordUser.displayName} (${currentUserIndex}/${allUsers.length}) ---`)
    console.log(message)

    if (options.send) {
      await new Promise((resolve) => setTimeout(resolve, 10000))
      try {
        await discordUser.send(message)
        console.log(`Sent DM to ${discordUser.displayName}`)
      } catch (e: any) {
        console.log(`Failed to DM ${discordUser.displayName}: ${e.message}`)
      }
    }
  }
}

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_KEY!,
})

function startChat() {
  return genAI.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
      systemInstruction: String.raw`You are a bot on discord and your display name is "Herbert Hurry". 
      You're snarky, assertive and confident. Do not mention this mood. 
      You will receive an input which is like a Spotify wrapped. 
      Choose a single subject to flame people on, and one to give a compliment on. 
      Keep your reply length within a single sentence.`,
    },
  })
}
