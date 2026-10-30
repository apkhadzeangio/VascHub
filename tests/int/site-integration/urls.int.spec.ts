import { describe, expect, it } from 'vitest'
import type { Payload } from 'payload'
import { documentPath } from '@/utilities/documentPath'
import { generateMeta } from '@/utilities/generateMeta'
import { resolveRedirect } from '@/utilities/resolveRedirect'
import { generateURL } from '@/plugins'
import { getServerSideURL } from '@/utilities/getURL'

describe('Collection-aware public URLs', () => {
  it.each([
    ['pages', 'home', '/'],
    ['pages', 'about', '/about'],
    ['posts', 'home', '/posts/home'],
    ['posts', 'ქართული', `/posts/${encodeURIComponent('ქართული')}`],
  ])(
    '%s/%s has a consistent route in metadata and the SEO editor',
    async (collection, slug, path) => {
      expect(documentPath(collection, slug)).toBe(path)
      const metadata = await generateMeta({
        doc: { slug },
        collection: collection as 'pages' | 'posts',
      })
      expect(metadata.alternates?.canonical).toBe(path)
      expect(metadata.openGraph?.url).toBe(path)
      const args = { doc: { slug }, collectionConfig: { slug: collection } } as Parameters<
        typeof generateURL
      >[0]
      expect(await generateURL(args)).toBe(new URL(path, getServerSideURL()).href)
    },
  )
  it('does not invent a route for a missing slug or an unrelated collection', () => {
    expect(documentPath('posts', '')).toBeUndefined()
    expect(documentPath('users', 'admin')).toBeUndefined()
  })
})

describe('Custom redirects', () => {
  it.each(['/api/users', 'javascript:alert(1)', '/old?again=1', '/old#again'])(
    'rejects unsafe or looping target %s',
    async (url) => {
      expect(await resolveRedirect({} as Payload, { type: 'custom', url }, '/old')).toBeUndefined()
    },
  )
  it('honors the selected type instead of a stale URL from a previously custom link', async () => {
    expect(
      await resolveRedirect({} as Payload, { type: 'reference', url: '/stale' }, '/old'),
    ).toBeUndefined()
  })
  it('retains a valid public destination', async () => {
    expect(await resolveRedirect({} as Payload, { type: 'custom', url: '/library' }, '/old')).toBe(
      '/library',
    )
  })
})
