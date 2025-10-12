import { Client, EmbedBuilder, TextChannel } from 'discord.js'
import db from '../../firestore/setupFirestore.ts'

export function setup(client: Client<boolean>) {
  if (!db) {
    return
  }

  db.collection('price-lists').onSnapshot(async (snapshot) => {
    const embedChannel = (await client.channels.fetch('1426138997415219301')) as TextChannel
    try {
      await embedChannel.bulkDelete(10)
    } catch {
      // Do nothing
    }

    for (let i = 0; i < snapshot.docs.length; i++) {
      const doc = snapshot.docs[i]

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

interface PriceDocument {
  title: string
  description: string
  fields: {
    name: string
    value: string
    inline: boolean
  }[]
}
