import express from 'express'
import { Client, Events, GatewayIntentBits } from 'discord.js'

const app = express()
app.use(express.json())

const port = process.env.PORT || 4000

const TOKEN = process.env.LEAF_TOKEN
// const LEAF_GUILD_ID = process.env.LEAF_DISCORD_GUILD_ID
const LEAF_GUILD_ID = '1424725730004045826'

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
})

let clientReadyPromise: Promise<void> | null = null

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

export function setupApi() {
  app.post('/submit-leaf-form', async (req, res) => {
    try {
      const { age } = req.body ?? {}

      if (typeof age !== 'number') {
        return res.status(400).json({ error: 'age must be a number' })
      }

      if (age < 18) {
        return res.status(403).json({ error: 'You must be at least 18 years old.' })
      }

      await ensureClientReady()

      const guild = await client.guilds.fetch(LEAF_GUILD_ID!)

      const channelId = guild.systemChannelId ?? guild.rulesChannelId ?? guild.publicUpdatesChannelId ?? null

      if (!channelId) {
        return res.status(500).json({ error: 'No suitable channel found to create an invite for this guild.' })
      }

      const invite = await guild.invites.create(channelId, {
        maxUses: 1,
        unique: true,
      })

      return res.status(200).json({ inviteUrl: invite.url })
    } catch (error) {
      console.error('Error handling /submit-leaf-form request', error)
      return res.status(500).json({ error: 'Failed to create invite' })
    }
  })

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })
}
