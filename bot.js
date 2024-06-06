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

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`)
})

client.on('messageCreate', (message) => {  
  if (message.author.bot) return 

  if (message.stickers.hasAny('1199452550198460416')) {
    message.channel.send(`Best ${userMention(process.env.AEON)}!`)
    console.log('best aeon', Date())
  }
})

client.login(TOKEN)