import { userMention } from "discord.js"

export default async function (messageText, message) {
  if (/\bdn\b/i.test(messageText)) {
    await message.channel.send(`${userMention(message.author.id)} What\s dn?`)
    return true
  }
}
