import { Firestore, getFirestore } from 'firebase-admin/firestore'
import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app'
import serviceAccount from '/etc/secrets/buyer-management-94826-firebase-adminsdk-yiuo8-baa8ef4085.json'
// For Windows
// import serviceAccount from '../etc/secrets/buyer-management-94826-firebase-adminsdk-yiuo8-baa8ef4085.json'
import { config } from 'dotenv'

config()

let db: Firestore | null = null

if (process.env.ENVIRONMENT === 'production') {
  initializeApp({
    credential: cert(serviceAccount as ServiceAccount),
  })

  db = getFirestore()
}

export default db
