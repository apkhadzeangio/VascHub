import { getServerSideSitemap } from 'next-sitemap'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getServerSideURL } from '@/utilities/getURL'

export const dynamic = 'force-dynamic'

export async function GET() {
  const payload = await getPayload({ config })
  const origin = getServerSideURL()
  const entries = ['/events', '/specialists', '/centres'].map((path) => ({
    loc: `${origin}${path}`,
  }))
  for (const collection of ['specialists', 'centres'] as const) {
    let page = 1
    let more = true
    while (more) {
      const result = await payload.find({
        collection,
        overrideAccess: false,
        draft: false,
        depth: 0,
        limit: 500,
        page,
        sort: 'id',
        where: { _status: { equals: 'published' } },
        select: { slug: true },
      })
      entries.push(
        ...result.docs
          .filter((doc) => doc.slug)
          .map((doc) => ({
            loc: `${origin}/${collection}/${encodeURIComponent(doc.slug)}`,
          })),
      )
      more = result.hasNextPage
      page++
    }
  }
  const response = await getServerSideSitemap(entries)
  response.headers.set('Cache-Control', 'no-store')
  return response
}
