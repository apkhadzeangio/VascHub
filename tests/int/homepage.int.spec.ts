import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { upcomingEvents } from '@/Homepage/events'
import { queryPublishedPosts } from '@/search/queryPublishedPosts'
import { assertTestDatabase, demoContent, fixtureContext } from '../helpers/homepageFixture'

let payload: Payload
let publishedID: number
let draftID: number
let categoryID: number

describe('Public homepage search and CMS fields', () => {
  beforeAll(async () => {
    assertTestDatabase()
    payload = await getPayload({ config })
    const category = await payload.create({
      collection: 'categories',
      data: { title: 'ინტეგრაციის კატეგორია', slug: `integration-topic-${Date.now()}` },
    })
    categoryID = category.id
    const published = await payload.create({
      collection: 'posts',
      context: fixtureContext,
      data: {
        title: 'ქართულიძიებისტესტი — გამოქვეყნებული',
        slug: `integration-public-${Date.now()}`,
        content: demoContent,
        _status: 'published',
        categories: [category.id],
      },
    })
    publishedID = published.id
    const draft = await payload.create({
      collection: 'posts',
      draft: true,
      context: fixtureContext,
      data: {
        title: 'ქართულიძიებისტესტი — დაფარული',
        slug: `integration-private-${Date.now()}`,
        content: demoContent,
        _status: 'draft',
      },
    })
    draftID = draft.id
  })
  afterAll(async () => {
    for (const id of [publishedID, draftID])
      if (id) await payload.delete({ collection: 'posts', id, context: fixtureContext })
    if (categoryID) await payload.delete({ collection: 'categories', id: categoryID })
    await payload.destroy()
  })
  it('searches Georgian titles and excludes drafts even when explicitly selected', async () => {
    const results = await queryPublishedPosts(payload, { query: 'ქართულიძიებისტესტი' })
    expect(results.docs.map((p) => p.id)).toEqual([publishedID])
    const curated = await queryPublishedPosts(payload, { ids: [publishedID, draftID] })
    expect(curated.docs.map((p) => p.id)).toEqual([publishedID])
  })
  it('finds published material by category and returns a real empty state', async () => {
    expect(
      (await queryPublishedPosts(payload, { query: 'ინტეგრაციის კატეგორია' })).docs.map(
        (p) => p.id,
      ),
    ).toEqual([publishedID])
    expect(
      (await queryPublishedPosts(payload, { query: 'არარსებულისიტყვისშემოწმება' })).totalDocs,
    ).toBe(0)
  })
  it('does not expose index copies directly to anonymous visitors', async () => {
    await expect(
      payload.find({ collection: 'search', overrideAccess: false }),
    ).rejects.toMatchObject({ status: 403 })
  })
  it('removes an unpublished article from public search immediately', async () => {
    await payload.update({
      collection: 'posts',
      id: publishedID,
      data: { _status: 'draft' },
      context: fixtureContext,
    })
    expect((await queryPublishedPosts(payload, { query: 'ქართულიძიებისტესტი' })).totalDocs).toBe(0)
    await payload.update({
      collection: 'posts',
      id: publishedID,
      data: { _status: 'published' },
      context: fixtureContext,
    })
  })
  it('rejects executable event URLs and anonymous CMS writes', async () => {
    await expect(
      payload.create({
        collection: 'pages',
        context: fixtureContext,
        data: {
          title: 'Unsafe event test',
          slug: 'unsafe-event-test',
          hero: { type: 'none' },
          layout: [],
          homepage: { events: [{ title: 'სატესტო', url: 'javascript:alert(1)' }] },
        },
      }),
    ).rejects.toMatchObject({ status: 400 })
    await expect(
      payload.create({
        collection: 'pages',
        overrideAccess: false,
        data: {
          title: 'Anonymous',
          slug: 'anonymous-home-test',
          hero: { type: 'none' },
          layout: [],
        },
      }),
    ).rejects.toMatchObject({ status: 403 })
  })
})

describe('Georgian event dates', () => {
  it('keeps today near UTC midnight, excludes prior local dates and places undated notices last', () => {
    const events = [
      { id: 'undated', date: null },
      { id: 'prior-local-day', date: '2026-10-28T19:00:00Z' },
      { id: 'today-in-georgia', date: '2026-10-28T21:00:00Z' },
    ]
    expect(upcomingEvents(events, new Date('2026-10-28T20:30:00Z')).map((e) => e.id)).toEqual([
      'today-in-georgia',
      'undated',
    ])
    expect(events[0].id).toBe('undated')
  })
})
