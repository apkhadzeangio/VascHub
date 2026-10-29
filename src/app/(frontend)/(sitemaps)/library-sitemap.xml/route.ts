import { getServerSideSitemap } from 'next-sitemap'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getServerSideURL } from '@/utilities/getURL'
import { resourceURL } from '@/Library/options'

export const dynamic = 'force-dynamic'

export async function GET() {
  const payload = await getPayload({ config })
  const entries = [{ loc: `${getServerSideURL()}/library`, lastmod: new Date().toISOString() }]
  let page = 1
  let more = true
  while (more) {
    const result = await payload.find({
      collection: 'library-resources',
      overrideAccess: false,
      draft: false,
      depth: 0,
      limit: 500,
      page,
      sort: 'id',
      where: { _status: { equals: 'published' } },
      select: { slug: true, updatedAt: true },
    })
    entries.push(
      ...result.docs
        .filter((doc) => doc.slug)
        .map((doc) => ({
          loc: `${getServerSideURL()}${resourceURL(doc)}`,
          lastmod: doc.updatedAt,
        })),
    )
    more = result.hasNextPage
    page++
  }
  const response = await getServerSideSitemap(entries)
  response.headers.set('Cache-Control', 'no-store')
  return response
}
