import { beforeAll, afterAll, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import type { Header, Footer } from '@/payload-types'
import { getPublicReference } from '@/utilities/getPublicReference'
import { demoContent, fixtureContext, assertTestDatabase } from '../../helpers/homepageFixture'

let payload: Payload | undefined
let originalHeader: Header
let originalFooter: Footer
const ids: number[] = []
const unique = `integration-reference-${Date.now()}`

describe('Public redirect references and navigation authoring', () => {
  beforeAll(async () => {
    assertTestDatabase()
    if (!['localhost', '127.0.0.1'].includes(new URL(process.env.DATABASE_URL!).hostname))
      throw new Error('Reference fixtures require a loopback test database.')
    payload = await getPayload({ config })
    originalHeader = await payload.findGlobal({ slug: 'header', depth: 0 })
    originalFooter = await payload.findGlobal({ slug: 'footer', depth: 0 })
    for (const status of ['published', 'draft'] as const) {
      const post = await payload.create({
        collection: 'posts',
        context: fixtureContext,
        draft: status === 'draft',
        data: {
          title: `${unique}-${status}`,
          slug: `${unique}-${status}`,
          content: demoContent,
          _status: status,
        },
      })
      ids.push(post.id)
    }
  }, 60000)
  afterAll(async () => {
    if (!payload) return
    try {
      if (originalHeader)
        await payload.updateGlobal({
          slug: 'header',
          data: { navItems: originalHeader.navItems },
          context: fixtureContext,
        })
      if (originalFooter)
        await payload.updateGlobal({
          slug: 'footer',
          data: { navItems: originalFooter.navItems },
          context: fixtureContext,
        })
      for (const id of ids)
        await payload.delete({ collection: 'posts', id, context: fixtureContext })
    } finally {
      await payload.destroy()
    }
  }, 60000)
  it('resolves numeric, numeric-string and populated references by authoritative ID', async () => {
    for (const value of [ids[0], String(ids[0]), { id: ids[0], slug: 'stale-slug' }])
      expect(await getPublicReference(payload!, { relationTo: 'posts', value })).toBe(
        `/posts/${unique}-published`,
      )
  })
  it('excludes drafts, stale populated drafts and missing references', async () => {
    for (const value of [
      ids[1],
      { id: ids[1], slug: 'was-public', _status: 'published' },
      2147483647,
      'not-an-id',
    ])
      expect(await getPublicReference(payload!, { relationTo: 'posts', value })).toBeUndefined()
  })
  it.each(['header', 'footer'] as const)(
    'rejects unsafe custom URLs when editing %s',
    async (slug) => {
      await expect(
        payload!.updateGlobal({
          slug,
          context: fixtureContext,
          data: {
            navItems: [{ link: { type: 'custom', label: 'Unsafe', url: '/safe/../admin' } }],
          },
        }),
      ).rejects.toMatchObject({ status: 400 })
    },
  )
  it('rejects a draft navigation reference and accepts a published reference', async () => {
    await expect(
      payload!.updateGlobal({
        slug: 'header',
        context: fixtureContext,
        data: {
          navItems: [
            {
              link: {
                type: 'reference',
                label: 'Draft',
                reference: { relationTo: 'posts', value: ids[1] },
              },
            },
          ],
        },
      }),
    ).rejects.toMatchObject({ status: 400 })
    await expect(
      payload!.updateGlobal({
        slug: 'header',
        context: fixtureContext,
        data: {
          navItems: [
            {
              link: {
                type: 'reference',
                label: 'Public',
                reference: { relationTo: 'posts', value: ids[0] },
              },
            },
          ],
        },
      }),
    ).resolves.toBeDefined()
  })
})
