import path from 'node:path'
import type { Payload } from 'payload'
import type { LibraryResource } from '@/payload-types'
import { MAX_PDF_BYTES } from './files'

/** Call with the result of findPublicResource; file metadata never leaves the server. */
export async function availablePDF(payload: Payload, resource: LibraryResource) {
  if (resource._status !== 'published' || !resource.pdf) return null
  const file = await payload.findByID({
    collection: 'library-files',
    id: typeof resource.pdf === 'object' ? resource.pdf.id : resource.pdf,
    overrideAccess: true,
    disableErrors: true,
    depth: 0,
  })
  if (
    !file?.rightsConfirmed ||
    !file.filename ||
    file.mimeType !== 'application/pdf' ||
    !file.filesize ||
    file.filesize > MAX_PDF_BYTES ||
    path.basename(file.filename) !== file.filename
  )
    return null
  return file
}
