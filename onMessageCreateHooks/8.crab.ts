import { Message } from 'discord.js'

export default async function (message: Message) {
  const content = message.content.toLowerCase()

  if (content.includes('crab') || content.includes('🦀')) {
    await message.react('🦀')
  }
}
