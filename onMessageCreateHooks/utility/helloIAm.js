export default function (message, self) {
  const pattern = /(I am|I'm)\s+(.+)/i
  const match = message.match(pattern)

  if (match) {
    const input = match[2]
    return `Hello ${input}, I am ${self}`
  } else {
    return null
  }
}
