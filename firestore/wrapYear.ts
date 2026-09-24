import { DocumentReference, Firestore } from 'firebase-admin/firestore'

export function currentWrapYear(date = new Date()): number {
  return date.getUTCFullYear()
}

export function wrapUserRef(db: Firestore, userId: string, year = currentWrapYear()): DocumentReference {
  return db.collection('wrapped').doc(String(year)).collection('users').doc(userId)
}

export function normalizeEmote(emote: string): string {
  return emote.trim().toLowerCase() || 'unknown'
}
