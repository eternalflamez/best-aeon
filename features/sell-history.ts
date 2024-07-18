import { Client, Message, TextChannel } from 'discord.js'
// @ts-ignore
import sellChannels from '../constants/sellChannels.js'

export default function setup(client: Client, historyChannelId: string, region: 'NA' | 'EU') {
  let historyMessage: void | Message<true> | undefined
  const history: HistoryMessage[] = []

  client.once('ready', async () => {
    try {
      const channel = await client.channels.fetch(historyChannelId)

      if (channel && channel instanceof TextChannel) {
        historyMessage = await channel.messages
          .fetch()
          .then((messages) => messages.filter((message) => message.author.id === client.user?.id))
          .then((messages) => messages.at(0))

        if (!historyMessage) {
          // Create new message
          historyMessage = await channel.send('Loading History...')
        }

        for (const sellChannelId in sellChannels) {
          if (sellChannels[sellChannelId].region !== region) {
            return
          }

          const sellChannel = await client.channels.fetch(sellChannelId).catch(() => {})

          if (sellChannel && sellChannel instanceof TextChannel) {
            let sellMessages = await sellChannel.messages
              .fetch()
              .then((messages) => messages.filter((message) => message.content.includes('<t:')))

            if (sellMessages) {
              for (const sellMessage of sellMessages.values()) {
                history.push({
                  id: sellMessage.id,
                  date: extractTimestamp(sellMessage.content),
                  text: sellMessage.content,
                })
              }
            }
          }
        }

        console.log(history.length)

        await createMessage(historyMessage, history)
      }
    } catch (e: any) {
      if (e.rawError?.message === 'Missing Permissions' || e.rawError?.message === 'Missing Access') {
        return
      }

      console.error(e)
    }
  })

  client.on('messageCreate', async (message) => {
    if (message.author.bot || message.system) return

    try {
      if (!historyMessage) {
        return
      }

      if (sellChannels[message.channelId] && sellChannels[message.channelId].region === region) {
        if (message.content.includes('<t:')) {
          history.push({
            id: message.id,
            date: extractTimestamp(message.content),
            text: message.content,
          })

          await createMessage(historyMessage, history)
        }
      }
    } catch (e: any) {
      if (e.rawError?.message === 'Missing Permissions') {
        return
      }

      console.error(e)
    }
  })

  client.on('messageDelete', async (message) => {
    if (!historyMessage) {
      return
    }

    const index = history.findIndex((value) => value.id === message.id)

    if (index < 0) {
      return
    }

    history.splice(index, 1)

    await createMessage(historyMessage, history)
  })

  client.on('messageDeleteBulk', async (messages) => {
    if (!historyMessage) {
      return
    }

    messages.each((message) => {
      const index = history.findIndex((value) => value.id === message.id)

      if (index < 0) {
        return
      }

      history.splice(index, 1)
    })

    await createMessage(historyMessage, history)
  })

  client.on('messageUpdate', async (_, newMessage) => {
    if (!historyMessage) {
      return
    }

    const messageIndex = history.findIndex((message) => message.id === newMessage.id)

    if (messageIndex !== -1) {
      if (newMessage.partial) {
        newMessage = await newMessage.fetch()
      }

      history[messageIndex].date = extractTimestamp(newMessage.content)
      history[messageIndex].text = newMessage.content

      await createMessage(historyMessage, history)
    }
  })
}

function createMessage(historyMessage: Message<true>, history: HistoryMessage[]) {
  history.sort((a, b) => a.date - b.date)

  let result = history
    .map((message) => {
      return message.text.replaceAll('@everyone', '').replaceAll('@', '').replaceAll('  ', ' ').trim()
    })
    .join('\r\n\r\n')

  if (result.length === 0) {
    result = NO_SELLS_COMMENTS[Math.round(Math.random() * NO_SELLS_COMMENTS.length)]
  }

  return historyMessage.edit(result)
}

function extractTimestamp(messageText: String) {
  // Regex to match the timestamp pattern <t:number:format>
  const pattern = /<t:(\d+):[a-zA-Z]>/
  const match = messageText.match(pattern)

  if (match) {
    // Extract the numeric part of the timestamp
    const timestamp = parseInt(match[1], 10)
    return timestamp
  } else {
    return 0
  }
}

type HistoryMessage = {
  id: string
  date: number
  text: string
}

const NO_SELLS_COMMENTS = [
  'No sells going, time to sign up as a hustler by PM-ing Dubious Detective!',
  'Nothing to see here, move along.',
  'Khajit has no wares because buyers have no coin.',
  'One small step for man, one empty sell list for mankind.',
  "The sell list is as empty as a goblin's heart.",
  "Silence in the marketplace... eerie, isn't it?",
  'No transactions today. The vault sleeps.',
  'All quiet on the selling front.',
  'Not a single sell in sight. Must be a holiday.',
  'No sells today, just tumbleweeds.',
  'The sell list is on vacation. Please check back later.',
  'Even the buyer took the day off.',
  "The market is as still as a dragon's lair.",
  'Zero sells. Time to sharpen your blades instead.',
  'The sell list is a blank canvas today.',
  'Nothing here. Did we miss a memo?',
  'No sells yet. Maybe you can change that?',
  "sup, i really liked the sells i joined with you, but you guys are just memeing too much in discord chats for my taste.\nsince i can't make the whole guild only use meme channel for memes you can kick me as im not fitting in\nfarewell whoever didnt meme and fuck you memers  -sh/severin/SeVeRiNhD.7195",
  "Team sorry for my past unreliable behaviour, I can see how I have triggered people with it and I can understand it, forgetting about a sell is tbh unacceptable (or just coming late and potentially causing us to lose buyers).\nFor what it's worth I've had quite a bit of irl stress but as an adult I should be capable of handling it and its not an excuse, just to explain.\nI've dealt with everything and I'm happy to show you the respect u deserve\n& I'm thankful that I still have the opportunity to raid here ❤️ best sell guild eu no cap\nsry for ping :monkapls:",
]
