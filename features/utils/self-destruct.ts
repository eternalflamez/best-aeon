import { Client, Message, TextChannel } from 'discord.js'

export async function setupSelfDestruct(client: Client, botClientId: string) {
  const botStartedChannel = (await client.channels.fetch('1318663460569092186')) as TextChannel
  botStartedChannel.send(`Succesfully booted! ${botClientId}`)
}

export async function checkDestruction(client: Client, botClientId: string, message: Message, name?: string) {
  if (
    message.channelId === '1318663460569092186' &&
    message.author.id === client.user?.id &&
    !message.content.includes(botClientId)
  ) {
    console.log(`A new instance has started, self-destructing ${name}`)
    await client.destroy()
    return true
  }

  return false
}
