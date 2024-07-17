import { ThreadAutoArchiveDuration } from "discord.js"
import sellChannels from "../constants/sellChannels.js"

export default async function (messageText, message) {
  if (sellChannels[message.channelId]) {
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
