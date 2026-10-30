import type { Payload, PayloadRequest } from 'payload'
import { documentPath } from './documentPath'

export async function getPublicReference(
  payload: Payload,
  reference?: { relationTo?: string; value?: unknown } | null,
  req?: PayloadRequest,
) {
  const collection = reference?.relationTo
  if (collection !== 'pages' && collection !== 'posts') return undefined
  const value = reference?.value
  const rawID = value && typeof value === 'object' && 'id' in value ? value.id : value
  const id = typeof rawID === 'string' && /^\d+$/.test(rawID) ? Number(rawID) : rawID
  if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0) return undefined
  // Always re-read by ID: a populated redirect/global reference may be stale.
  const result = await payload.find({
    collection,
    req,
    overrideAccess: false,
    draft: false,
    depth: 0,
    limit: 1,
    where: { and: [{ id: { equals: id } }, { _status: { equals: 'published' } }] },
    select: { slug: true },
  })
  return documentPath(collection, result.docs[0]?.slug)
}
