import { Client } from 'discord.js'
import { Firestore, Timestamp } from 'firebase-admin/firestore'
import db from '../../firestore/setupFirestore'

const COLLECTION = 'bot_instances'

export async function setupSelfDestruct(
  client: Client,
  botClientId: string,
  name: string,
  database: Firestore | null = db,
) {
  if (!database) {
    console.warn(`[self-destruct] Firestore not initialized; skipping for ${name}`)
    return
  }

  const docRef = database.collection(COLLECTION).doc(name)

  await docRef.set({
    clientId: botClientId,
    timestamp: Timestamp.now(),
  })

  console.log(`Successfully booted! ${name} ${botClientId}`)

  docRef.onSnapshot((snap) => {
    const data = snap.data()
    if (data && data.clientId !== botClientId) {
      console.log(`A new instance has started, self-destructing ${name}`)
      client.destroy()
    }
  })
}
