import cors from 'cors'
import dedent from 'dedent'
import { Client, Events, GatewayIntentBits, TextChannel } from 'discord.js'
import { config } from 'dotenv'
import express from 'express'
import { v4 as uuidv4 } from 'uuid'

import leafDb from '../leaf-firestore'
import { COLORS } from '../constants/colors'
import { createApprovalButtons } from '../createInvite/approvalHandler'

config()

const app = express()
app.use(cors())
app.use(express.json())

const port = process.env.PORT || 80

const TOKEN = process.env.LEAF_TOKEN
// const LEAF_GUILD_ID = process.env.LEAF_DISCORD_GUILD_ID
const LEAF_GUILD_ID = '1424725730004045826'

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
})

let clientReadyPromise: Promise<void> | null = null

function validateSubmitLeafFormInput(body: unknown): {
  valid: boolean
  errors: string[]
} {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { valid: false, errors: ['Request body must be an object.'] }
  }

  const payload = body as Record<string, unknown>

  const stringFields = [
    'discordName',
    'nickname',
    'gw2Name',
    'joinReason',
    'fashionWars',
    'favoriteActivity',
    'favoriteNpc',
  ] as const
  const errors: string[] = []

  for (const field of stringFields) {
    const value = payload[field]
    if (typeof value !== 'string' || value.trim().length <= 1) {
      errors.push(`${field} must be a non-empty string.`)
    }
  }

  const age = payload.age
  if (typeof age !== 'number' || !Number.isFinite(age) || age < 18) {
    errors.push('age must be a number greater than or equal to 18.')
  }

  return { valid: errors.length === 0, errors }
}

function ensureClientReady() {
  if (!clientReadyPromise) {
    clientReadyPromise = new Promise<void>((resolve, reject) => {
      client.once(Events.ClientReady, () => resolve())

      client.login(TOKEN!).catch((error) => {
        clientReadyPromise = null
        reject(error)
      })
    })
  }

  return clientReadyPromise
}

async function sendDiscordMessage(newUser: NewUserSignup, userId: string) {
  let channel

  try {
    channel = await client.channels.fetch(process.env.LEAF_GUILD_NEW_USER_CHANNEL!)
  } catch {
    console.log('No access to the new signups channel!')
  }

  if (!channel || !(channel instanceof TextChannel)) {
    return
  }

  const approvalRow = createApprovalButtons({ userId })

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

async function saveInformation(body: NewUserSignup) {
  const date = new Date()

  const day = date.getDate()
  const month = date.getMonth() + 1
  const year = date.getFullYear()

  let currentDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  const { discordName, nickname, gw2Name, age, joinReason, fashionWars, favoriteActivity, favoriteNpc } = body
  let docName = `${currentDate} ${gw2Name}`

  if ((await leafDb?.collection('signups').doc(docName).get())?.exists) {
    docName += `-${uuidv4()}`
  }

  await leafDb?.collection('signups').doc(docName).set({
    discordName,
    nickname,
    gw2Name,
    age,
    joinReason,
    fashionWars,
    favoriteActivity,
    favoriteNpc,
    timestamp: new Date().toISOString(),
  })

  return docName
}

export function setupApi() {
  app.post('/submit-leaf-form', async (req, res) => {
    try {
      const body = req.body ?? {}
      const validation = validateSubmitLeafFormInput(body)

      if (!validation.valid) {
        return res.status(400).json({ error: 'Invalid input', details: validation.errors })
      }

      await ensureClientReady()

      const guild = await client.guilds.fetch(LEAF_GUILD_ID!)

      const channelId = guild.systemChannelId ?? guild.rulesChannelId ?? guild.publicUpdatesChannelId ?? null

      if (!channelId) {
        console.log('LEAF API: No suitable channel found to create an invite for this guild.')
        return res.status(500).json({ error: 'No suitable channel found to create an invite for this guild.' })
      }

      try {
        const docName = await saveInformation(body)

        await sendDiscordMessage(body, docName).catch((error) => {
          console.log(`Failed to send signup ${JSON.stringify(body)}`, error)
        })
      } catch (error) {
        console.log(`Failed to save signup ${JSON.stringify(body)}`, error)
      }

      const invite = await guild.invites.create(channelId, {
        maxUses: 1,
        unique: true,
      })

      return res.status(200).json({ inviteUrl: invite.url })
    } catch (error) {
      console.error('LEAF API: Error handling /submit-leaf-form request', error)
      return res.status(500).json({ error: 'Failed to create invite' })
    }
  })

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })
}

interface NewUserSignup {
  discordName: string
  nickname: string
  gw2Name: string
  age: number
  joinReason: string
  fashionWars: string
  favoriteActivity: string
  favoriteNpc: string
}
