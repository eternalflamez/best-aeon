export default function (message: string, self: string) {
  const pattern = /\b(I am|I'm|Im)\b\s+(.+)/i
  const match = message.match(pattern)

  if (match) {
    const input = match[2]
    return `Hello ${input}, I am ${self}`
  } else {
    return null
  }
}
