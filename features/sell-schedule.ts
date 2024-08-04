import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, Message, TextChannel } from 'discord.js'
// @ts-ignore
import sellChannels from '../constants/sellChannels.js'

const MCMysticCoinEmoji = '545057156274323486'

export default function setup(client: Client, historyChannelId: string, region: 'NA' | 'EU') {
  let historyMessage: void | Message<true> | undefined
  const history: HistoryMessage[] = []
  let isStarting = true

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
            continue
          }

          const sellChannel = await client.channels.fetch(sellChannelId)

          if (sellChannel && sellChannel instanceof TextChannel) {
            let sellMessages = await sellChannel.messages
              .fetch()
              .then((messages) => messages.filter((message) => message.content.includes('<t:')))

            if (sellMessages) {
              for (const sellMessage of sellMessages.values()) {
                await addToHistory(sellMessage)
              }
            }
          }
        }

        console.log(history.length)

        await createMessage(historyMessage)

        isStarting = false
      }
    } catch (e: any) {
      console.error('---- AN ERROR WAS THROWN ----')
      console.error('message', e.rawError?.message)
      console.error('content', e.requestBody?.json?.content)
      console.error('---- END ERROR ----')

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
          await addToHistory(message)

          await createMessage(historyMessage)
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

    await createMessage(historyMessage)
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

    await createMessage(historyMessage)
  })

  client.on('messageUpdate', async (_, updatedMessage) => {
    if (!historyMessage) {
      return
    }

    const messageIndex = history.findIndex((message) => message.id === updatedMessage.id)

    if (messageIndex !== -1) {
      if (updatedMessage.partial) {
        updatedMessage = await updatedMessage.fetch()
      }

      const match = getTimestampMatch(updatedMessage.content)
      const timeText = extractTimeText(match)
      const timestamp = extractTimestamp(match)
      history[messageIndex].date = timestamp
      history[messageIndex].text = getSortedMessage(updatedMessage, timeText)

      await createMessage(historyMessage)
    } else {
      // If something was updated and now matches, add it
      if (sellChannels[updatedMessage.channelId] && sellChannels[updatedMessage.channelId].region === region) {
        if (updatedMessage.partial) {
          updatedMessage = await updatedMessage.fetch()
        }

        if (updatedMessage.content.includes('<t:')) {
          await addToHistory(updatedMessage)

          await createMessage(historyMessage)
        }
      }
    }
  })

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) {
      return
    }

    if (isStarting) {
      await interaction.reply({
        content: "I'm still booting, please try again in at least 10 seconds.",
        ephemeral: true,
      })
      return
    }

    try {
      const id = interaction.customId

      if (id === `my-${region}-schedule`) {
        await interaction.deferReply({
          ephemeral: true,
        })

        const result = history.filter((historyMessage) => {
          return historyMessage.reactors.includes(interaction.user.id)
        })

        if (!result.length) {
          await interaction.editReply({
            content: "You didn't sign up to anything!",
          })
        } else {
          await interaction.editReply({
            content: getPrunedOutput(result),
          })
        }
      }
    } catch (e: any) {
      console.error(e.rawError?.message || 'Something went wrong?')
      console.error(e)

      try {
        interaction.editReply({
          content: 'Oops, there was an error loading your schedule',
        })
        return
      } catch {
        console.error('--- ERROR: Was not allowed to reply to interaction ---')
      }
    }
  })

  client.on('messageReactionAdd', async (reaction, user) => {
    const matchingHistoryItem = history.find((item) => item.id === reaction.message.id)

    if (!matchingHistoryItem || reaction.emoji.id !== MCMysticCoinEmoji) {
      return
    }

    matchingHistoryItem.reactors.push(user.id)
  })

  client.on('messageReactionRemove', async (reaction, user) => {
    const matchingHistoryItem = history.find((item) => item.id === reaction.message.id)

    if (!matchingHistoryItem || reaction.emoji.id !== MCMysticCoinEmoji) {
      return
    }

    const index = matchingHistoryItem.reactors.indexOf(user.id)
    if (index > -1) {
      // only splice array when item is found
      matchingHistoryItem.reactors.splice(index, 1) // 2nd parameter means remove one item only
    }
  })

  async function addToHistory(message: Message<boolean>) {
    const match = getTimestampMatch(message.content)
    const timeText = extractTimeText(match)
    const timestamp = extractTimestamp(match)

    let messageReaction = message.reactions.cache.get(MCMysticCoinEmoji)

    if (!messageReaction) {
      return
    }

    if (messageReaction.partial) {
      messageReaction = await messageReaction.fetch()
    }

    const users = await messageReaction.users.fetch()
    const userIds = users.map((_, id) => {
      return id
    })

    history.push({
      id: message.id,
      channelId: message.channelId,
      reactors: userIds,
      date: timestamp,
      text: getSortedMessage(message, timeText),
    })
  }

  function createMessage(historyMessage: Message<true>) {
    if (history.length === 0) {
      return historyMessage.edit(NO_SELLS_COMMENTS[Math.round(Math.random() * NO_SELLS_COMMENTS.length)])
    }

    const result = getPrunedOutput(history)

    const mySchedule = new ButtonBuilder()
      .setCustomId(`my-${region}-schedule`)
      .setLabel('My Schedule')
      .setStyle(ButtonStyle.Primary)

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(mySchedule)

    return historyMessage.edit({
      content: result,
      components: [row],
    })
  }
}

function getPrunedOutput(history: HistoryMessage[]) {
  history.sort((a, b) => a.date - b.date)

  let hasAddedSubText = false

  const result = history.reduce<{ length: number; output: string[] }>(
    (cum, message, index) => {
      const newText = message.text.replaceAll('@everyone', '').replaceAll('@', '').replaceAll('  ', ' ').trim()

      // Message limit is 2000
      if (cum.length + newText.length < 1900) {
        cum.output.push(newText)

        return {
          length: cum.length + newText.length,
          output: cum.output,
        }
      }

      if (!hasAddedSubText) {
        hasAddedSubText = true
        cum.output.push(`⚠️ ${history.length - index} items not displayed. ⚠️`)
      }

      return cum
    },
    {
      length: 0,
      output: [],
    },
  )

  return result.output.join('\r\n\r\n')
}

function getTimestampMatch(messageText: string) {
  // Regex to match the timestamp pattern <t:number:format>
  const pattern = /<t:(\d+):[a-zA-Z]>/
  return messageText.match(pattern)
}

function extractTimeText(match: RegExpMatchArray | null) {
  if (match) {
    // Extract the whole timestamp
    return match[0]
  } else {
    return '0'
  }
}

function extractTimestamp(match: RegExpMatchArray | null) {
  if (match) {
    // Extract the numeric part of the timestamp
    const timestamp = parseInt(match[1], 10)

    return timestamp
  } else {
    return 0
  }
}

function getSortedMessage(message: Message<boolean>, timeText: string) {
  // Sort the content message to have the time at the beginning
  if (timeText === '0') {
    // some weird input, do not manipulate text
    return message.content
  }

  const messageWithoutTime = message.content.replace(timeText, '')
  return timeText.trim() + ' ' + messageWithoutTime.trim() + ' ' + message.url
}

type HistoryMessage = {
  id: string
  channelId: string
  reactors: string[]
  date: number
  text: string
}

const NO_SELLS_COMMENTS = [
  'Loading History...',
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
