const { Client, GatewayIntentBits, userMention } = require('discord.js')

const TOKEN = process.env.TOKEN
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
})

let maxCounter = 1

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`)
})

client.on('messageCreate', (message) => {  
  if (message.author.bot) return 

  try {
    if (message.stickers.hasAny('1199452550198460416')) {
      message.channel.send(`Best ${userMention(process.env.AEON)}!`)
      console.log('best aeon', Date())
    }

    const messageText = message.content.toLowerCase()

    if (/ma+x/i.test(messageText)) {
      message.channel.send(`M${'A'.repeat(maxCounter)}X ${userMention(process.env.MAX)}!`)
      maxCounter++

      console.log('max counter is', maxCounter)

      if (maxCounter > 200) {
        message.channel.send('MAXimum length reached, resetting!')
      }

      if (maxCounter > 205) {
        message.channel.send('MAAAAX...')
        maxCounter = 0
      }
    }

    if (message.channel.id === process.env.RESETCHANNEL) {
      if (messageText.includes('reset')) {
        message.channel.send('max?')
        maxCounter = 1
      }

      if (messageText.includes('maxcounter=')) {
        maxCounter = parseInt(messageText.replace('maxcounter=', ''))
      }
    }
  } catch(e) {
    console.error(e)
  }
})

client.login(TOKEN)

// Totally inconspicuous hello world website

const express = require('express')
const app = express()
const port = process.env.PORT || 4000;

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
