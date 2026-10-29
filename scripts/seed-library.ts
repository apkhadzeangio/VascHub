import { getPayload } from 'payload'
import config from '../src/payload.config'
import { importLibrary } from '../src/Library/seed/import'

const payload = await getPayload({ config })
try {
  const result = await importLibrary(payload, process.env.LIBRARY_SEED_PUBLISH === '1')
  payload.logger.info(
    { ...result, publish: process.env.LIBRARY_SEED_PUBLISH === '1' },
    'Verified library metadata import complete. Existing content was skipped.',
  )
} finally {
  await payload.destroy()
}
