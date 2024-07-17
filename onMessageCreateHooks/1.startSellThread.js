import { ThreadAutoArchiveDuration } from "discord.js"
import allowedChannels from "../constants/allowedChannels.js"

export default async function (messageText, message) {
  if (allowedChannels[message.channelId]) {
    if (messageText.includes("<t:")) {
      const timestampPattern = /<t:\d+:[a-zA-Z]>/g
      const name = message.content.split("\n")[0].replace(timestampPattern, "").replace("@everyone", "").trim()

      await message.startThread({
        name,
        autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
      })
    }

    return true
  }
}
