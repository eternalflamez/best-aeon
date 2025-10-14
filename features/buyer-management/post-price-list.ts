import { Client, EmbedBuilder, TextChannel } from 'discord.js'
import db from '../../firestore/setupFirestore.ts'
import { DocumentData, DocumentSnapshot } from 'firebase-admin/firestore'
import { config } from 'dotenv'

config()

interface IDictionary {
  [index: string]: string
}

let cachedMessageIds: IDictionary = {}

export async function setup(client: Client<boolean>, priceEmbedChannelId: string, inclusions: string[]) {
  const embedChannel = (await client.channels.fetch(priceEmbedChannelId)) as TextChannel

  inclusions.forEach((id) => {
    if (!db) {
      return
    }

    db.collection('price-lists')
      .doc(id)
      .onSnapshot((snapshot) => {
        onSnapshot(id, snapshot, embedChannel)
      })
  })
}

async function onSnapshot(
  id: string,
  snapshot: DocumentSnapshot<DocumentData, DocumentData>,
  embedChannel: TextChannel,
) {
  const document = JSON.parse(snapshot.get('value')) as PriceDocument

  if (!cachedMessageIds[id]) {
    cachedMessageIds[id] = document.messageId
  } else if (cachedMessageIds[id] !== document.messageId) {
    // If we updated the message ID, prevent looping
    cachedMessageIds[id] = document.messageId
    return
  }

  const embed = new EmbedBuilder()
    .setTitle(document.title)
    .setDescription(document.description)
    .addFields(...document.fields)
    .setURL(process.env.PRICE_UPDATE_URL!)

  try {
    const targetMessageId = snapshot.get('messageId')
    const message = embedChannel.messages.cache.get(targetMessageId)

    if (!message) {
      const newMessage = await embedChannel.send({
        embeds: [embed],
      })

      snapshot.ref.update({
        messageId: newMessage.id,
      })
    } else {
      await message.edit({
        embeds: [embed],
      })
    }
  } catch (e) {
    console.error(e)
  }
}
