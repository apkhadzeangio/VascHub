import type { Payload, Where } from 'payload'

/** Public search always queries the authoritative, access-controlled Posts collection.
 * Search-index copies are kept for CMS use, never exposed as public result metadata.
 */
export async function queryPublishedPosts(
  payload: Payload,
  {
    query = '',
    page = 1,
    limit = 12,
    ids,
  }: { query?: string; page?: number; limit?: number; ids?: number[] } = {},
) {
  const term = query.trim().slice(0, 160)
  const and: Where[] = [{ _status: { equals: 'published' } }]
  if (ids) and.push({ id: { in: ids } })
  if (term) {
    const categories = await payload.find({
      collection: 'categories',
      overrideAccess: false,
      depth: 0,
      limit: 100,
      where: { title: { like: term } },
      select: { title: true },
    })
    and.push({
      or: [
        { title: { like: term } },
        { 'meta.title': { like: term } },
        { 'meta.description': { like: term } },
        ...(categories.docs.length
          ? [{ categories: { in: categories.docs.map((c) => c.id) } }]
          : []),
      ],
    })
  }
  return payload.find({
    collection: 'posts',
    overrideAccess: false,
    draft: false,
    depth: 1,
    limit,
    page,
    sort: '-updatedAt',
    where: { and },
    select: {
      title: true,
      slug: true,
      meta: true,
      categories: true,
      publishedAt: true,
      updatedAt: true,
    },
  })
}
