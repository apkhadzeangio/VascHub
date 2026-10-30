import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { getHomepageData, getHomepagePage } from '@/Homepage/data'
import { getCachedDocument } from '@/utilities/getDocument'
import { queryPublishedPosts } from '@/search/queryPublishedPosts'
import { demoContent, fixtureContext } from '../../helpers/homepageFixture'

const preview = vi.hoisted(() => ({ enabled: false }))
vi.mock('next/headers', () => ({ draftMode: async () => ({ isEnabled: preview.enabled }) }))
// Exercise real Payload access/draft behavior without requiring a Next request cache.
vi.mock('next/cache', () => ({
  unstable_cache: (fn: () => Promise<unknown>) => fn,
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

let payload: Payload | undefined
let homeID: number | undefined
const postIDs: number[] = []
let draftID: number
const unique = `cms-b-${Date.now()}`

describe('Real Payload public readers and homepage curation', () => {
  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL || '')
    if (
      !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
      !['/vaschub_cms_test', '/vaschub_integration_test', '/vaschub_test'].includes(url.pathname)
    ) {
      throw new Error(
        'CMS fixtures require a dedicated loopback vaschub_cms_test (CI: vaschub_test) database.',
      )
    }
    payload = await getPayload({ config })
    for (const suffix of ['a', 'b', 'draft']) {
      const post = await payload.create({
        collection: 'posts',
        context: fixtureContext,
        data: {
          title: `${unique}-${suffix}`,
          slug: `${unique}-${suffix}`,
          content: demoContent,
          _status: 'published',
        },
      })
      postIDs.push(post.id)
    }
    draftID = postIDs[2]
    const home = await payload.create({
      collection: 'pages',
      context: fixtureContext,
      data: {
        title: 'Published CMS test home',
        slug: 'home',
        _status: 'published',
        hero: { type: 'none' },
        layout: [{ blockType: 'content', columns: [{ size: 'full' }] }],
        homepage: {
          resources: [postIDs[1], postIDs[0], draftID],
          newsPosts: [draftID, postIDs[0]],
          academy: { post: draftID },
        },
      },
    })
    homeID = home.id
    // A formerly public selection can become a draft after the homepage is saved.
    await payload.update({
      collection: 'posts',
      id: draftID,
      context: fixtureContext,
      data: { _status: 'draft' },
    })
  }, 60000)

  afterAll(async () => {
    if (!payload) return
    try {
      if (homeID) await payload.delete({ collection: 'pages', id: homeID, context: fixtureContext })
      for (const id of postIDs)
        await payload.delete({ collection: 'posts', id, context: fixtureContext })
    } finally {
      await payload.destroy()
    }
  }, 60000)

  it('never returns a draft through the reusable cached document reader', async () => {
    expect(await getCachedDocument('posts', `${unique}-draft`)()).toBeUndefined()
    expect(await getCachedDocument('posts', `${unique}-a`)()).toMatchObject({ id: postIDs[0] })
  })

  it('preserves manual ordering and excludes draft selections in every homepage slot', async () => {
    const result = await getHomepageData()
    expect(result.resources.map((p) => p.id)).toEqual([postIDs[1], postIDs[0]])
    expect(result.news.map((p) => p.id)).toEqual([postIDs[0]])
    expect(result.academyPost).toBeUndefined()
  })

  it('falls back to public recent posts when the curated selection is empty', async () => {
    await payload!.update({
      collection: 'pages',
      id: homeID!,
      context: fixtureContext,
      data: {
        homepage: { resources: [], newsPosts: [postIDs[0]], academy: { post: postIDs[0] } },
      },
    })
    const result = await getHomepageData()
    expect(result.resources.length).toBeGreaterThan(0)
    expect(result.resources.length).toBeLessThanOrEqual(3)
    expect(result.resources.map((p) => p.id)).not.toContain(draftID)
    for (const post of result.resources) {
      const doc = await payload!.findByID({
        collection: 'posts',
        id: post.id,
        overrideAccess: false,
      })
      expect(doc._status).toBe('published')
    }
  })

  it('keeps a newer home draft private while making it available in preview', async () => {
    await payload!.update({
      collection: 'pages',
      id: homeID!,
      draft: true,
      context: fixtureContext,
      data: { title: 'Private CMS home draft', _status: 'draft' },
    })
    expect((await getHomepagePage())?.title).toBe('Published CMS test home')
    preview.enabled = true
    try {
      expect((await getHomepagePage())?.title).toBe('Private CMS home draft')
    } finally {
      preview.enabled = false
    }
  })

  it('removes an unpublished post from both normal and explicitly curated public searches', async () => {
    await payload!.update({
      collection: 'posts',
      id: postIDs[1],
      context: fixtureContext,
      data: { _status: 'draft' },
    })
    const result = await queryPublishedPosts(payload!, { query: unique, ids: postIDs })
    expect(result.docs.map((p) => p.id)).toEqual([postIDs[0]])
  })
})
