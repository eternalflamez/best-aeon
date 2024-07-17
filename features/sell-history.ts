import { Client, Message, TextChannel, time } from 'discord.js'
// @ts-ignore
import sellChannels from '../constants/sellChannels.js'

const historyChannel = '1263126224247717928'

export default function setup(client: Client) {
  let historyMessage: void | Message<true> | undefined
  const history: HistoryMessage[] = []

  client.once('ready', async () => {
    try {
      const channel = await client.channels.fetch(historyChannel)

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
          const sellChannel = await client.channels.fetch(sellChannelId)

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
                  region: sellChannels[sellChannelId].region,
                })
              }
            }
          }
        }

        console.log(history.length)

        createMessage(historyMessage, history)
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

      if (sellChannels[message.channelId]) {
        if (message.content.includes('<t:')) {
          history.push({
            id: message.id,
            date: extractTimestamp(message.content),
            text: message.content,
            region: sellChannels[message.channelId].region,
          })

          createMessage(historyMessage, history)
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

    createMessage(historyMessage, history)
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

      createMessage(historyMessage, history)
    }
  })
}

function createMessage(historyMessage: Message<true>, history: HistoryMessage[]) {
  history.sort((a, b) => a.date - b.date)

  let result = history
    .map((message) => {
      const text = message.text.replaceAll('@everyone', '').replaceAll('@', '').replaceAll('  ', ' ').trim()

      return `${message.region} -- ${text}`
    })
    .join('\r\n\r\n')

  if (result.length === 0) {
    result = 'No sells going, time to sign up as a hustler by PM-ing Dubious Detective!'
  }

  historyMessage.edit(result)
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
  region: string
}
