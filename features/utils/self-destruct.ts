import { Client } from 'discord.js'
import { Timestamp } from 'firebase-admin/firestore'
import db from '../../firestore/setupFirestore.ts'

const COLLECTION = 'bot_instances'

export async function setupSelfDestruct(client: Client, botClientId: string, name: string) {
  if (!db) {
    console.warn(`[self-destruct] Firestore not initialized; skipping for ${name}`)
    return
  }

  const environment = process.env.ENVIRONMENT ?? 'develop'
  const instanceKey = `${name}:${environment}`
  const docRef = db.collection(COLLECTION).doc(instanceKey)

  await docRef.set({
    clientId: botClientId,
    environment,
    timestamp: Timestamp.now(),
  })

  console.log(`Succesfully booted! ${instanceKey} ${botClientId}`)

  docRef.onSnapshot((snap) => {
    const data = snap.data()
    if (data && data.clientId !== botClientId) {
      console.log(`A new instance has started, self-destructing ${instanceKey}`)
      client.destroy()
    }
  })
}
