import { Firestore, getFirestore } from 'firebase-admin/firestore'
import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'

config()

const SERVICE_ACCOUNT_FILE = 'buyer-management-94826-firebase-adminsdk-yiuo8-baa8ef4085.json'

const serverPath = `/etc/secrets/${SERVICE_ACCOUNT_FILE}`
const localPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'etc',
  'secrets',
  SERVICE_ACCOUNT_FILE,
)
const serviceAccountPath = existsSync(serverPath) ? serverPath : localPath

let db: Firestore | null = null

if (process.env.ENVIRONMENT === 'production') {
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8')) as ServiceAccount

  const app = initializeApp({
    credential: cert(serviceAccount),
  })

  db = getFirestore(app)
}

export default db
