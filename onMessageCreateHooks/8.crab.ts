import { Message } from 'discord.js'

export default async function (message: Message) {
  if (message.content.toLowerCase().includes('crab')) {
    await message.react('🦀')
  }
}
