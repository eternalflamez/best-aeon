export default async function (messageText, message, maxCounter) {
  if (/ma+x/i.test(messageText) || message.stickers.hasAny("1110247288166678649")) {
    if (Math.random() < 0.7) {
      return
    }

    maxCounter.value++

    console.log("max counter is", maxCounter.value)

    await message.channel.send(`M${"A".repeat(maxCounter.value % 55)}X!`)

    return true
  }
}
