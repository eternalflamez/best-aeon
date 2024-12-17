import { userMention } from 'discord.js'

export default function (message: string, self: string, authorId: string) {
  message = message.replace(/<@!?(\d+)>/g, userMention(authorId))

  const pattern = /\b(I am|I'm|Im)\b\s+(.+)/i
  const match = message.match(pattern)

  if (match) {
    const input = match[2]

    return {
      output: `Hello ${input}, I am ${self}`,
      clip: input,
    }
  } else {
    return null
  }
}
