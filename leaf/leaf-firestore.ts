import { Firestore, getFirestore } from 'firebase-admin/firestore'
import { initializeApp, cert } from 'firebase-admin/app'
import serviceAccount from '/etc/secrets/leaf-bot-3ac4d-firebase-adminsdk-fbsvc-ce8eba6211.json'
// For Windows
// import serviceAccount from '../etc/secrets/leaf-bot-3ac4d-firebase-adminsdk-fbsvc-ce8eba6211.json' with { type: 'json' }
import { config } from 'dotenv'

config()

let leafDb: Firestore | null = null

const app = initializeApp(
  {
    // @ts-ignore
    credential: cert(serviceAccount),
  },
  'LEAF',
)

leafDb = getFirestore(app)

export default leafDb
