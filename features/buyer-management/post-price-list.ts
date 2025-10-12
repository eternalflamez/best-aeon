import { Client, EmbedBuilder, TextChannel } from 'discord.js'
import db from '../../firestore/setupFirestore.ts'

export function setup(client: Client<boolean>, priceEmbedChannelId: string, inclusions: string[]) {
  if (!db) {
    return
  }

  db.collection('price-lists').onSnapshot(async (snapshot) => {
    const embedChannel = (await client.channels.fetch(priceEmbedChannelId)) as TextChannel

    try {
      await embedChannel.bulkDelete(10)
    } catch {
      // Do nothing
    }

    const filteredList = snapshot.docs.filter((doc) => {
      return inclusions.includes(doc.get('name'))
    })

    for (let i = 0; i < filteredList.length; i++) {
      const doc = filteredList[i]

      const document = JSON.parse(doc.get('value')) as PriceDocument

      const embed = new EmbedBuilder()
        .setTitle(document.title)
        .setDescription(document.description)
        .addFields(...document.fields)
        .setURL('https://price-list-builder.onrender.com/')

      try {
        await embedChannel.send({
          embeds: [embed],
        })
      } catch (e) {
        console.error(e)
      }
    }
  })
}
