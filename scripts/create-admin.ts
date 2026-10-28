import { getPayload } from 'payload'
import config from '../src/payload.config'

const email = process.env.ADMIN_EMAIL
const password = process.env.ADMIN_PASSWORD

if (!email || !password || password.length < 16) {
  throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 16 characters) on the server.')
}

const payload = await getPayload({ config })

try {
  const existing = await payload.count({ collection: 'users' })
  if (existing.totalDocs > 0) {
    throw new Error('An administrator already exists. Manage subsequent accounts in /admin.')
  }
  await payload.create({
    collection: 'users',
    data: { email, password, name: 'VascHub administrator' },
    overrideAccess: true,
    context: { bootstrapAdmin: true },
  })
  payload.logger.info('First VascHub administrator created. Sign in at /admin.')
} finally {
  await payload.destroy()
}
