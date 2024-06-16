const { Client, GatewayIntentBits, Partials, userMention } = require('discord.js')
const helloIAm = require('./helloIAm.js')

const TOKEN = process.env.TOKEN
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [
    Partials.Message, Partials.Channel, Partials.Reaction,
  ]
})

const allowedChannels = {
  '1249829604974268418': true, // instant-sales
  '821737329215275039': true, // instant-sells
  '803274143311069204': true, // scheduled-raids
  '982039087663951892': true, // scheduled-strikes
  '982039130047397988': true, // scheduled-fractals
  '842866010481885194': true, // scheduled-cms
}

let maxCounter = 1

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`)
})

client.on('messageCreate', async (message) => {  
  if (message.author.bot || message.system) return 

  try {
    if (message.stickers.hasAny('1199452550198460416')) {
      await message.channel.send(`Best AEON!`)
      return
    }

    const messageText = message.content.toLowerCase()

    if (message.channel.id === process.env.RESETCHANNEL) {
      if (messageText.includes('reset')) {
        await message.channel.send('max?')
        maxCounter = 1

        return
      }

      if (messageText.includes('maxcounter=')) {
        maxCounter = parseInt(messageText.replace('maxcounter=', ''))

        await message.channel.send(`set max counter to ${maxCounter}`)

        return
      }
    }

    if (/ma+x/i.test(messageText)) {
      maxCounter++

      if (maxCounter > 206 && Math.random() < 0.7) {
        return
      }

      console.log('max counter is', maxCounter)

      if (maxCounter > 200) {
        await message.channel.send('MAXimum length reached, resetting!')
        return
      }

      if (maxCounter === 206) {
        await message.channel.send('MAAAAX...')
        return
      }

      await message.channel.send(`M${'A'.repeat(maxCounter)}X!`)

      return
    }

    if (/\bnow\b/i.test(messageText) && Math.random() < 0.9) {
      await message.channel.send('WAAAOUUH IÄM NAOOUUU?')
      return
    }

    if (/\bdn\b/i.test(messageText) && Math.random() < 0.5) {
      await message.channel.send(`${userMention(message.author.id)} What\s dn?`)
      return
    }

    const iAm = helloIAm(messageText.replace(/<@!?(\d+)>/g, userMention(message.author.id)), userMention(client.user.id))

    if (iAm && Math.random() > 0.1) {
      await message.channel.send(iAm)
      return
    }
  } catch(e) {
    console.error(e)
  }
})

client.on('messageReactionAdd', async (reaction, user) => {
  if (reaction.partial) {
		try {
			await reaction.fetch()
		} catch (error) {
			console.error('Something went wrong when fetching the message:', error)
			return
		}
	}

  if (!allowedChannels[reaction.message.channelId]) {
    return
  }

  if (user.partial) {
    try {
      await user.fetch()
    } catch (error) {
      console.error('Something went wrong when fetching the user:', error)
			return
    }
  }
  
  if (!reaction.message.hasThread) {
    return
  }

  const thread = reaction.message.thread

  try {
    await thread.members.fetch()
    const isMember = thread.members.cache.has(user.id)

    if (!isMember) {
      await thread.members.add(user)
      console.log('added', user.displayName, 'to a thread')
    }
  } catch (error) {
    console.error('Error checking thread membership:', error)
  }
})

client.login(TOKEN)

// Totally inconspicuous hello world website

const express = require('express')
const app = express()
const port = process.env.PORT || 4000

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
