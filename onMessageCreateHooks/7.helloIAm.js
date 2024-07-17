import { userMention } from "discord.js"
import helloIAm from "./utility/helloIAm.js"

export default async function (client, message) {
  const iAm = helloIAm(
    message.content.replace(/<@!?(\d+)>/g, userMention(message.author.id)),
    userMention(client.user.id),
  )

  if (iAm && Math.random() < 0.1) {
    await message.channel.send(iAm)
    return true
  }
}
