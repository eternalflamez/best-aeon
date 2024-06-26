// require('dotenv').config()
const { Client, GatewayIntentBits, Partials, userMention, ThreadAutoArchiveDuration } = require('discord.js')
const helloIAm = require('./helloIAm.js')
const replyTo = require('./gemini.js')
const timeoutReactions = require('./timeoutReactions.js')

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
  '1196920908842008728': true, // na-scheduled-raids
  '1196923586791874640': true, // na-scheduled-strikes
  '1196923623705936033': true, // na-scheduled-cms
}

let lastGeminiCallTime = 0
let maxCounter = 1

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`)
})

client.on('messageCreate', async (message) => {  
  if (message.author.bot || message.system) return 

  try {
    const messageText = message.content.toLowerCase()

    if (message.channelId === process.env.RESETCHANNEL) {
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
    
    if (allowedChannels[message.channelId]) {
      if (messageText.includes('<t:')) {
        const timestampPattern = /<t:\d+:[a-zA-Z]>/g;
        const name = message.content.split('\n')[0].replace(timestampPattern, '').replace('@everyone', '').trim()

        await message.startThread({
          name,
          autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
        })
      }

      return
    }

    if (message.mentions.has(client.user.id)) {      
      const now = Date.now()

      if (now - lastGeminiCallTime < 5000) {        
        const reactions = timeoutReactions[Math.round(Math.random() * timeoutReactions.length)]

        await message.channel.send(reactions)
        return
      }

      let filteredMessage = message.content.replace(userMention(client.user.id), '')

      message.mentions.users.each((user) => {
        filteredMessage = filteredMessage.replace(userMention(user.id), user.globalName)
      })

      try {
        if (Math.random < 0.01) {
          filteredMessage = 'Yell MAAAAAAAAAAAAAAAAAAAAAAAX for me with an amount of A\'s between 20 and 30. Reply with nothing other than the yell.'
        }

        lastGeminiCallTime = now

        let reply = await replyTo(filteredMessage)

        reply = reply.replace('@', '')

        if (reply) {
          await message.channel.send(reply)
        } else {
          await message.channel.send('Sorry I was too stupid too cook up a reply and instead generated nothing.')
        }
      } catch(e) {
        if (e.message === 'Missing Permissions') {
          return
        }

        console.log(e)
        await message.channel.send('Sorry I was too stupid too cook up a reply and instead had an error.')
      }
      return
    }

    if (message.stickers.hasAny('1199452550198460416')) {
      await message.channel.send(`Best AEON!`)
      return
    }
    
    if (/ma+x/i.test(messageText) || message.stickers.hasAny('1110247288166678649')) {
      if (Math.random() < 0.7) {
        return
      }

      maxCounter++

      console.log('max counter is', maxCounter)

      await message.channel.send(`M${'A'.repeat(maxCounter % 55)}X!`)

      return
    }

    if (/\bnow\b/i.test(messageText)) {
      if (Math.random < 0.01) {
        message.channel.send('Wat is now kauw\nWatskeburt in de schuur')
        return
      }

      if (Math.random < 0.3) {
        await message.channel.send('WAAAOUUH IÄM NAOOUUU?')
        return
      }
    }

    if (/\bdn\b/i.test(messageText)) {
      await message.channel.send(`${userMention(message.author.id)} What\s dn?`)
      return
    }

    const iAm = helloIAm(message.content.replace(/<@!?(\d+)>/g, userMention(message.author.id)), userMention(client.user.id))

    if (iAm && Math.random() < 0.1) {
      await message.channel.send(iAm)
      return
    }
  } catch(e) {
    if (e.message === 'Missing Permissions') {
      return
    }

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
