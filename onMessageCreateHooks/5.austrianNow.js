export default async function (messageText, message) {
  if (/\bnow\b/i.test(messageText)) {
    if (Math.random < 0.01) {
      message.channel.send("Wat is now kauw\nWatskeburt in de schuur")
      return true
    }

    if (Math.random < 0.3) {
      await message.channel.send("WAAAOUUH IÄM NAOOUUU?")
      return true
    }
  }
}
