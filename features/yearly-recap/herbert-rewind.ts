import { Client, Guild } from 'discord.js'
import db from '../../firestore/setupFirestore'
import { CustomerDib, UserDoc } from './rewind-types'
import { GenerateContentResponse, GoogleGenAI, HarmBlockThreshold, HarmCategory, PartUnion } from '@google/genai'

export async function sendRewind(client: Client) {
  if (!db) {
    return
  }

  // Rise
  const guild = client.guilds.cache.get('544892003545251841')
  if (!guild) {
    return
  }

  const usersSnap = await db.collection('users').get()
  const allUsersRaw: UserDoc[] = []

  usersSnap.forEach((d) => {
    allUsersRaw.push({ ...(d.data() as UserDoc), id: d.id })
  })

  await guild.members.fetch()

  const allUsers = allUsersRaw.filter((u) => guild.members.cache.has(u.id))

  const helloSnaps = await Promise.all(
    allUsers.map(async (user) => {
      const collection = await db!.collection('users').doc(user.id).collection('hello_i_am').get()

      return {
        id: user.id,
        docs: collection.docs,
        size: collection.size,
      }
    }),
  )

  const dadCounts = helloSnaps.map((snap) => snap.size)
  const pingCounts = allUsers.map((u) => u.ping_count || 0)
  const createdSignupsCount = allUsers
    .map((u) => u.created_signups || 0)
    .filter((createdSignups) => createdSignups !== 0)
  const dibbers = await getFastestDibbers(guild)

  const signupsRoot = await db.collection('signups').listDocuments()
  const userSignups = await Promise.all(signupsRoot.map((signup) => signup.collection('users').get()))

  const signupParticipationCounts: Record<string, number> = {}

  for (const userData of allUsers) {
    let participationCount = 0

    userSignups.forEach((d) => {
      if (d.docs.some((doc) => doc.data().user_id === userData.id)) {
        participationCount++
      }
    })

    if (participationCount > 0) {
      signupParticipationCounts[userData.id] = participationCount
    }
  }

  console.log(`There are ${allUsers.length} users`)
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
    const dibsItems = dibbers.filteredDibs.filter((dibs) => dibs.user_id === userData.id)

    const helloItems = helloSnap?.docs.map((d) => d.data()) || []

    const pingCount = userData.ping_count || 0
    const cooldownCount = userData.cooldown_triggers || 0
    const errorCount = userData.error_triggers || 0
    const banCount = userData.block_responses || 0

    const helloCount = helloItems.length || 0
    const createdSignups = userData.created_signups || 0
    const signupChecks = userData.requested_signups_count || 0
    const emptySignupChecks = userData.requested_empty_signups_count || 0

    const percentile = (list: number[], value: number) => {
      // console.log(list, value, Math.floor(((list.filter((v) => v <= value).length - 1) / (list.length - 1)) * 100))
      return Math.floor(((list.filter((v) => v <= value).length - 1) / (list.length - 1)) * 100)
    }

    const pingPercent = percentile(pingCounts, pingCount)
    const dadPercent = percentile(dadCounts, helloCount)
    const createdSignupPercent = percentile(createdSignupsCount, createdSignups)

    const shuffledHello = [...helloItems].sort(() => 0.5 - Math.random())
    const topDadTriggers = shuffledHello
      .slice(0, 3)
      .map((i) => `- ${i.text_trigger}`)
      .join('\n')

    const signupParticipationCount = signupParticipationCounts[userData.id] || 0
    const signupPercent = percentile(Object.values(signupParticipationCounts), signupParticipationCount)

    const emojiCounts: Record<string, number> = {}

    for (const signups of userSignups) {
      for (const doc of signups.docs) {
        const data = doc.data()

        if (data.user_id === userData.id) {
          emojiCounts[data.emote_used] = (emojiCounts[data.emote_used] || 0) + 1
        }
      }
    }

    const emojiList = Object.entries(emojiCounts)
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
    if (pingCount > 0) lines.push(`You used me more than **${pingPercent}%** of users.`)

    lines.push(`\n📋 **Sells**`)
    lines.push(`- Sells you signed up for: **${signupParticipationCount}**`)
    lines.push(`- Sells you posted: **${createdSignups}**`)
    lines.push(`- Clicked My Schedule: **${signupChecks}** time(s)`)
    lines.push(`- How many times you found out you didn't even sign up to anything: **${emptySignupChecks}**`)
    lines.push(`You participated in more sells than **${signupPercent}%** of users.`)
    if (createdSignups > 0) {
      lines.push(`You posted more sells than **${createdSignupPercent}%** of users that posted sells.`)
    }
    lines.push(`\n<:MCMysticCoin:545057156274323486> **Signup emojis you used this year:**`)
    lines.push(emojiList)

    lines.push(`\n👋 **Hello I'm**`)
    lines.push(`You triggered this dad joke **${helloCount}** times.`)
    if (topDadTriggers.length) {
      lines.push(`Here's our top ${topDadTriggers.length >= 3 ? 3 : topDadTriggers.length}:\n${topDadTriggers}`)
    }
    if (helloCount > 0) lines.push(`You caused more dad jokes than **${dadPercent}%** of users.`)

    if (dibsItems.length > 0) {
      let best = Math.min(...dibsItems.map((i) => i.response_time || Infinity))
      let bestSuffix = 'ms'

      if (best > 3000) {
        best /= 1000
        best = Math.round(best)
        bestSuffix = ' seconds'
      }

      const userBestRank = dibbers.fastestDibbers.findIndex(([uid]) => uid === userData.id) + 1

      lines.push(`\n🛎️ **Customer Support**`)
      lines.push(`- You called dibs **${dibsItems.length}** times`)
      lines.push(
        `- Your fastest response time was **${best.toString() + bestSuffix}** — you're the **#${userBestRank}** fastest overall.`,
      )
    }

    let message = lines.join('\n')

    const chat = startChat()
    let geminiConclusion: GenerateContentResponse

    let parts = [{ text: message }] as PartUnion[]
    geminiConclusion = await chat.sendMessage({ message: parts })

    message += `\n\n${geminiConclusion.text}`
    message += `\n\n_If you didn't enjoy this, make sure to complain about it in_ https://discord.com/channels/544892003545251841/803265818644709436`

    await new Promise((resolve) => setTimeout(resolve, 10000))

    console.log(`Sending a message to ${discordUser.displayName}`)
    console.log(message)
    console.log(`Finished ${currentUserIndex} out of ${allUsers.length} users`)

    try {
      // await discordUser.send(message)
    } catch (e: any) {
      console.log(e.message)
    }
  }
}

async function getFastestDibbers(guild: Guild) {
  const allDibsSnap = await db!.collection('customer_dibs').get()
  const filteredDibs = allDibsSnap.docs
    .map((d) => d.data() as CustomerDib)
    .filter((d) => d.response_time != null && guild.members.cache.has(d.user_id))

  const bestPerUser: Record<string, number> = {}

  for (const dib of filteredDibs) {
    const uid = dib.user_id
    if (!bestPerUser[uid] || dib.response_time < bestPerUser[uid]) {
      bestPerUser[uid] = dib.response_time
    }
  }

  return {
    fastestDibbers: Object.entries(bestPerUser).sort((a, b) => a[1] - b[1]),
    filteredDibs,
  }
}

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_KEY!,
})

function startChat() {
  const chat = genAI.chats.create({
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

  return chat
}
