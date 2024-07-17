export default async function (messageText, message, maxCounter) {
  if (message.channelId === process.env.RESETCHANNEL) {
    if (messageText.includes("reset")) {
      await message.channel.send("max?")
      maxCounter.value = 1

      return true
    }

    if (messageText.includes("maxcounter=")) {
      maxCounter.value = parseInt(messageText.replace("maxcounter=", ""))

      await message.channel.send(`set max counter to ${maxCounter.value}`)

      return true
    }
  }
}
