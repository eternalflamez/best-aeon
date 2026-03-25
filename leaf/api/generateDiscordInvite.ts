import cors from 'cors'
import { Client, Events, GatewayIntentBits, TextChannel } from 'discord.js'
import { config } from 'dotenv'
import express from 'express'
import { v4 as uuidv4 } from 'uuid'

import leafDb from '../leaf-firestore'
import { NewUserSignup } from '../createInvite/interfaces/newUserSignup'

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

async function saveInformation(body: NewUserSignup, inviteCode: string) {
  const date = new Date()

  const day = date.getDate()
  const month = date.getMonth() + 1
  const year = date.getFullYear()

  let currentDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  const { discordName, nickname, gw2Name, age, joinReason, fashionWars, favoriteActivity, favoriteNpc } = body

  await leafDb?.collection('signups').doc(`${currentDate}_${gw2Name}_${inviteCode}`).set({
    discordName,
    nickname,
    gw2Name,
    age,
    joinReason,
    fashionWars,
    favoriteActivity,
    favoriteNpc,
    inviteCode,
    timestamp: new Date().toISOString(),
  })
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

      const invite = await guild.invites.create(channelId, {
        maxUses: 1,
        unique: true,
      })

      try {
        await saveInformation(body, invite.code)
      } catch (error) {
        console.log(`Failed to save signup ${JSON.stringify(body)}`, error)
      }

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
