import type { Payload } from 'payload'
import taxonomies from './taxonomies.json'
import resources from './resources.json'
import type { LibraryResource } from '@/payload-types'

/** Add missing verified entries only. Never update, delete or republish an existing entry. */
export async function importLibrary(payload: Payload, publish = false) {
  const ids = new Map<string, number>()
  const groups = [
    ['library-topics', taxonomies.topics],
    ['library-document-types', taxonomies.documentTypes],
    ['library-organizations', taxonomies.organizations],
  ] as const
  for (const [collection, entries] of groups) {
    for (const entry of entries) {
      const existing = await payload.find({
        collection,
        depth: 0,
        limit: 1,
        where: { slug: { equals: entry.slug } },
      })
      const doc = existing.docs[0] || (await payload.create({ collection, data: entry }))
      ids.set(`${collection}:${entry.slug}`, doc.id)
    }
  }
  let created = 0
  let skipped = 0
  for (const entry of resources) {
    const existing = await payload.find({
      collection: 'library-resources',
      depth: 0,
      limit: 1,
      draft: true,
      where: {
        or: [
          { importKey: { equals: entry.importKey } },
          { slug: { equals: entry.slug } },
          { doi: { equals: entry.doi } },
          { pmid: { equals: entry.pmid } },
        ],
      },
    })
    if (existing.docs.length) {
      skipped++
      continue
    }
    const { verificationSources, ...metadata } = entry
    if (!verificationSources.length || !entry.lastReviewedAt || !entry.officialSourceUrl)
      throw new Error(`Unverified seed: ${entry.importKey}`)
    const data = {
      ...metadata,
      documentType: ids.get(`library-document-types:${entry.documentType}`)!,
      publisherOrganization: ids.get(`library-organizations:${entry.publisherOrganization}`)!,
      clinicalTopics: entry.clinicalTopics.map((t) => ids.get(`library-topics:${t}`)!),
      _status: publish ? 'published' : 'draft',
    } as Omit<LibraryResource, 'id' | 'createdAt' | 'updatedAt'>
    await payload.create({ collection: 'library-resources', data, draft: !publish })
    created++
  }
  return { created, skipped }
}
