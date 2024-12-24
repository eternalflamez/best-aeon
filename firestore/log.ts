import { FieldValue, Firestore, getFirestore, Timestamp } from 'firebase-admin/firestore'
import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app'
import serviceAccount from '/etc/secrets/buyer-management-94826-firebase-adminsdk-yiuo8-baa8ef4085.json'
import { config } from 'dotenv'

config()

let db: Firestore | null = null

if (process.env.ENVIRONMENT === 'production') {
  initializeApp({
    credential: cert(serviceAccount as ServiceAccount),
  })

  db = getFirestore()
}

export async function logIAm(userId: string, trigger: string) {
  try {
    await db?.collection('users').doc(userId).collection('hello_i_am').doc().set({
      timestamp: Timestamp.now(),
      text_trigger: trigger,
    })
  } catch (e) {
    console.error(e)
  }
}

export async function logGemini(
  userId: string,
  username: string,
  response: string,
  triggerType: 'response' | 'cooldown' | 'error' | 'ban',
) {
  try {
    await db?.collection('users').doc(userId).collection('used_gemini').doc().set({
      timestamp: Timestamp.now(),
      trigger_type: triggerType,
    })

    await db
      ?.collection('users')
      .doc(userId)
      .set(
        {
          user_name: username,
          ping_count: FieldValue.increment(1),
          ...(triggerType === 'cooldown' && { cooldown_triggers: FieldValue.increment(1) }),
          ...(triggerType === 'error' && { error_triggers: FieldValue.increment(1) }),
          ...(response.includes('blocking you') && { block_responses: FieldValue.increment(1) }),
        },
        { merge: true },
      )
  } catch (e) {
    console.error(e)
  }
}

export async function logCallDibs(userId: string, username: string, messageCreationTime: number) {
  try {
    await db
      ?.collection('customer_dibs')
      .doc()
      .set({
        user_id: userId,
        user_name: username,
        timestamp: Timestamp.now(),
        response_time: Date.now() - messageCreationTime,
      })

    await db?.collection('users').doc(userId).set(
      {
        user_name: username,
      },
      { merge: true },
    )
  } catch (e) {
    console.error(e)
  }
}

export async function logSignup(
  messageId: string,
  userId: string,
  username: string,
  emote: string,
  signupCreatedTime: number,
) {
  try {
    await db
      ?.collection('signups')
      .doc(messageId)
      .collection('users')
      .doc(`${userId}-${emote}`)
      .set({
        user_id: userId,
        user_name: username,
        emote_used: emote,
        timestamp: Timestamp.now(),
        response_time: Date.now() - signupCreatedTime,
      })

    await db?.collection('users').doc(userId).set(
      {
        user_name: username,
      },
      { merge: true },
    )
  } catch (e) {
    console.error(e)
  }
}

export async function logRequestSignups(userId: string, username: string, signupCount: number) {
  try {
    await db
      ?.collection('users')
      .doc(userId)
      .set(
        {
          user_name: username,
          requested_signups_count: FieldValue.increment(1),
          ...(signupCount === 0 && { requested_empty_signups_count: FieldValue.increment(1) }),
        },
        { merge: true },
      )

    await db?.collection('users').doc(userId).collection('requested_signups').doc().set({
      signup_count: signupCount,
    })
  } catch (e) {
    console.error(e)
  }
}

export async function logStartSellThread(userId: string, username: string) {
  try {
    await db
      ?.collection('users')
      .doc(userId)
      .set(
        {
          user_name: username,
          created_signups: FieldValue.increment(1),
        },
        { merge: true },
      )
  } catch (e) {
    console.error(e)
  }
}
