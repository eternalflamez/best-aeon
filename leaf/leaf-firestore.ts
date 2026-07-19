import { Firestore, getFirestore } from 'firebase-admin/firestore'
import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'

config()

const SERVICE_ACCOUNT_FILE = 'leaf-bot-3ac4d-firebase-adminsdk-fbsvc-ce8eba6211.json'

const serverPath = `/etc/secrets/${SERVICE_ACCOUNT_FILE}`
const localPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'etc',
  'secrets',
  SERVICE_ACCOUNT_FILE,
)
const serviceAccountPath = existsSync(serverPath) ? serverPath : localPath

let leafDb: Firestore | null = null

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8')) as ServiceAccount

const app = initializeApp(
  {
    credential: cert(serviceAccount),
  },
  'LEAF',
)

leafDb = getFirestore(app)

export default leafDb
