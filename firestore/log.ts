import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import db from './setupFirestore'
import { normalizeEmote, wrapUserRef } from './wrapYear'

export async function logIAm(userId: string, trigger: string) {
  if (!db) {
    return
  }

  try {
    const userRef = wrapUserRef(db, userId)

    await userRef.set(
      {
        helloIAmCount: FieldValue.increment(1),
      },
      { merge: true },
    )

    await userRef.collection('helloIAm').doc().set({
      textTrigger: trigger,
      timestamp: Timestamp.now(),
    })
  } catch (e) {
    console.error(e)
  }
}

export async function logGemini(
  userId: string,
  username: string,
  response: string,
  triggerType: 'response' | 'cooldown' | 'error',
) {
  if (!db) {
    return
  }

  try {
    const wantsBlock = response.includes('blocking you') || response.includes('block you')

    await wrapUserRef(db, userId).set(
      {
        userName: username,
        'herbert.pings': FieldValue.increment(1),
        ...(triggerType === 'cooldown' && { 'herbert.cooldowns': FieldValue.increment(1) }),
        ...(triggerType === 'error' && { 'herbert.errors': FieldValue.increment(1) }),
        ...(wantsBlock && { 'herbert.blockDesire': FieldValue.increment(1) }),
      },
      { merge: true },
    )
  } catch (e) {
    console.error(e)
  }
}

export async function logCallDibs(userId: string, username: string, messageCreationTime: number) {
  if (!db) {
    return
  }

  try {
    const responseTimeMs = Date.now() - messageCreationTime
    const userRef = wrapUserRef(db, userId)

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef)
      const existingFastest = snap.exists ? (snap.data()?.dibs?.fastestMs as number | null | undefined) : null
      const fastestMs =
        existingFastest == null || responseTimeMs < existingFastest ? responseTimeMs : existingFastest

      tx.set(
        userRef,
        {
          userName: username,
          'dibs.count': FieldValue.increment(1),
          'dibs.fastestMs': fastestMs,
        },
        { merge: true },
      )
    })

    await userRef.collection('dibs').doc().set({
      responseTimeMs,
      timestamp: Timestamp.now(),
    })
  } catch (e) {
    console.error(e)
  }
}

export async function logSignup(
  messageId: string,
  userId: string,
  username: string,
  emote: string,
  _signupCreatedTime: number,
) {
  if (!db) {
    return
  }

  try {
    const userRef = wrapUserRef(db, userId)
    const sellSignupRef = userRef.collection('sellSignups').doc(messageId)
    const emoteKey = normalizeEmote(emote)

    await db.runTransaction(async (tx) => {
      const sellSnap = await tx.get(sellSignupRef)
      const isNewSell = !sellSnap.exists

      tx.set(
        userRef,
        {
          userName: username,
          [`emotes.${emoteKey}`]: FieldValue.increment(1),
          ...(isNewSell && { 'sells.signedUp': FieldValue.increment(1) }),
        },
        { merge: true },
      )

      if (isNewSell) {
        tx.set(sellSignupRef, { createdAt: Timestamp.now() })
      }
    })
  } catch (e) {
    console.error(e)
  }
}

export async function logRequestSignups(userId: string, username: string, signupCount: number) {
  if (!db) {
    return
  }

  try {
    await wrapUserRef(db, userId).set(
      {
        userName: username,
        'sells.myScheduleClicks': FieldValue.increment(1),
        ...(signupCount === 0 && { 'sells.emptyMySchedule': FieldValue.increment(1) }),
      },
      { merge: true },
    )
  } catch (e) {
    console.error(e)
  }
}

export async function logStartSellThread(userId: string, username: string) {
  if (!db) {
    return
  }

  try {
    await wrapUserRef(db, userId).set(
      {
        userName: username,
        'sells.posted': FieldValue.increment(1),
      },
      { merge: true },
    )
  } catch (e) {
    console.error(e)
  }
}

export { currentWrapYear, normalizeEmote } from './wrapYear'
