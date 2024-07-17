export default async function (message) {
  if (message.stickers.hasAny("1199452550198460416")) {
    await message.channel.send(`Best AEON!`)
    return true
  }
}
