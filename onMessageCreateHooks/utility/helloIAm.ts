import { userMention } from 'discord.js'
import { logIAm } from '../../firestore/log.ts'

export default function (message: string, self: string, authorId: string) {
  message = message.replace(/<@!?(\d+)>/g, userMention(authorId))

  const pattern = /\b(I am|I'm|Im)\b\s+(.+)/i
  const match = message.match(pattern)

  if (match) {
    const input = match[2]

    logIAm(authorId, input)

    return `Hello ${input}, I am ${self}`
  } else {
    return null
  }
}
