import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { loadEventItems } from '@/Events/queries'
import { assertTestDatabase, fixtureContext } from '../../helpers/homepageFixture'
import {
  cleanupEventsFixture,
  seedEventsFixture,
  setHomeEvents,
  type EventsFixture,
} from './fixture'

// A fixed "now" keeps the Tbilisi-day classification deterministic: 2026-10-29 14:00 in Tbilisi.
const NOW = new Date('2026-10-29T10:00:00Z')

let payload: Payload
let fixture: EventsFixture
const slugOf = (post: { slug?: string | null }) => `/posts/${post.slug}`

async function load() {
  return loadEventItems(payload, NOW)
}
const titles = (items: Awaited<ReturnType<typeof load>>) => items.map((i) => i.title).sort()

describe('Events & Training data layer (isolated *_test database)', () => {
  beforeAll(async () => {
    assertTestDatabase()
    payload = await getPayload({ config, key: 'events-int' })
    fixture = await seedEventsFixture(payload)
  })
  afterAll(async () => {
    if (fixture) await cleanupEventsFixture(payload, fixture)
    await payload.destroy()
  })

  it('shows published Posts of both categories and hides drafts and unrelated posts', async () => {
    const items = await load()
    expect(titles(items)).toEqual(
      [
        fixture.posts.congress.title,
        fixture.posts.workshop.title,
        fixture.posts.fellowship.title,
        fixture.posts.both.title,
      ].sort(),
    )
    expect(items.map((i) => i.title)).not.toContain(fixture.posts.draft.title)
    expect(items.map((i) => i.title)).not.toContain(fixture.posts.unrelated.title)
  })

  it('keeps professional development separate from events and never labels it as training', async () => {
    const byTitle = new Map((await load()).map((i) => [i.title, i]))
    expect(byTitle.get(fixture.posts.congress.title)?.types).toEqual(['events'])
    expect(byTitle.get(fixture.posts.fellowship.title)?.types).toEqual(['development'])
    expect(byTitle.get(fixture.posts.both.title)?.types).toEqual(['events', 'development'])
  })

  it('uses real fields only: posts carry no date or place, and are undated', async () => {
    const congress = (await load()).find((i) => i.title === fixture.posts.congress.title)!
    expect(congress).toMatchObject({
      day: null,
      dateStatus: 'undated',
      location: null,
      link: { kind: 'internal', href: slugOf(fixture.posts.congress) },
      description: fixture.posts.congress.meta?.description,
    })
  })

  it('merges a homepage notice into its Post through the canonical URL (no duplicate)', async () => {
    await setHomeEvents(payload, fixture, [
      {
        title: 'კონგრესის მოკლე ცნობა',
        date: '2026-12-15T10:00:00.000Z',
        location: 'სატესტო ქალაქი',
        url: slugOf(fixture.posts.congress),
      },
    ])
    const items = await load()
    const matches = items.filter((i) => i.canonical === slugOf(fixture.posts.congress))
    expect(matches).toHaveLength(1)
    expect(matches[0]).toMatchObject({
      source: 'post',
      day: '2026-12-15',
      dateStatus: 'upcoming',
      location: 'სატესტო ქალაქი',
    })
    expect(items).toHaveLength(4)
  })

  it('adds dated and past homepage notices that point to an external page, opened safely', async () => {
    await setHomeEvents(payload, fixture, [
      {
        title: 'გარე მომავალი ღონისძიება',
        date: '2026-10-28T21:00:00.000Z',
        url: 'https://example.org/congress',
      },
      {
        title: 'გარე ჩატარებული ღონისძიება',
        date: '2026-10-28T19:59:00.000Z',
        url: 'https://example.org/past/',
      },
    ])
    const items = await load()
    const upcoming = items.find((i) => i.title === 'გარე მომავალი ღონისძიება')!
    const past = items.find((i) => i.title === 'გარე ჩატარებული ღონისძიება')!
    expect(upcoming).toMatchObject({
      day: '2026-10-29',
      dateStatus: 'upcoming',
      link: { kind: 'external' },
    })
    expect(past).toMatchObject({ day: '2026-10-28', dateStatus: 'past' })
  })

  it('treats a notice without a date as undated, not as an upcoming event', async () => {
    await setHomeEvents(payload, fixture, [
      { title: 'თარიღის გარეშე ცნობა', url: 'https://example.org/no-date' },
    ])
    const entry = (await load()).find((i) => i.title === 'თარიღის გარეშე ცნობა')!
    expect(entry).toMatchObject({ day: null, dateStatus: 'undated' })
  })

  it('does not create actionable cards for drafts, missing targets or unverifiable local paths', async () => {
    await setHomeEvents(payload, fixture, [
      { title: 'დაფარულ სტატიაზე მიმავალი', url: slugOf(fixture.posts.draft) },
      { title: 'არარსებულ სტატიაზე მიმავალი', url: '/posts/ეს-სტატია-არ-არსებობს' },
    ])
    expect(titles(await load())).not.toContain('დაფარულ სტატიაზე მიმავალი')
    expect(titles(await load())).not.toContain('არარსებულ სტატიაზე მიმავალი')

    await setHomeEvents(payload, fixture, [
      { title: 'არარსებული ბიბლიოთეკის რესურსი', url: '/library/missing-resource-slug' },
      { title: 'სხვა ლოკალური გვერდი', url: '/some-other-page' },
    ])
    const after = titles(await load())
    expect(after).not.toContain('არარსებული ბიბლიოთეკის რესურსი')
    expect(after).not.toContain('სხვა ლოკალური გვერდი')
  })

  it('links a notice to a published Post outside the two categories without duplicating it', async () => {
    await setHomeEvents(payload, fixture, [
      {
        title: 'უკავშირო სტატიის ცნობა',
        date: '2027-02-01T08:00:00.000Z',
        url: slugOf(fixture.posts.unrelated),
      },
      { title: 'იგივე ცნობა განმეორებით', url: `${slugOf(fixture.posts.unrelated)}/` },
    ])
    const matches = (await load()).filter((i) => i.canonical === slugOf(fixture.posts.unrelated))
    expect(matches).toHaveLength(1)
    expect(matches[0]).toMatchObject({
      source: 'homepage',
      title: 'უკავშირო სტატიის ცნობა',
      dateStatus: 'upcoming',
    })
  })

  it('reads only the published homepage: a newer draft version never leaks', async () => {
    await setHomeEvents(payload, fixture, [
      { title: 'გამოქვეყნებული ცნობა', url: 'https://example.org/published' },
    ])
    await payload.update({
      collection: 'pages',
      id: fixture.home.id,
      draft: true,
      context: fixtureContext,
      data: {
        homepage: {
          events: [{ title: 'მხოლოდ მონახაზში', url: 'https://example.org/draft-only' }],
        },
      },
    })
    const names = titles(await load())
    expect(names).toContain('გამოქვეყნებული ცნობა')
    expect(names).not.toContain('მხოლოდ მონახაზში')
  })

  it('removes a Post from the public list the moment it is unpublished', async () => {
    await payload.update({
      collection: 'posts',
      id: fixture.posts.workshop.id,
      context: fixtureContext,
      data: { _status: 'draft' },
    })
    expect(titles(await load())).not.toContain(fixture.posts.workshop.title)
    await payload.update({
      collection: 'posts',
      id: fixture.posts.workshop.id,
      context: fixtureContext,
      data: { _status: 'published' },
    })
    expect(titles(await load())).toContain(fixture.posts.workshop.title)
  })

  it('returns an honest empty list when the categories do not exist', async () => {
    await setHomeEvents(payload, fixture, [])
    for (const category of [fixture.categories.events, fixture.categories.development]) {
      await payload.update({
        collection: 'categories',
        id: category.id,
        data: { slug: `${category.slug}-renamed` },
      })
    }
    try {
      expect(await load()).toEqual([])
    } finally {
      await payload.update({
        collection: 'categories',
        id: fixture.categories.events.id,
        data: { slug: 'international-events' },
      })
      await payload.update({
        collection: 'categories',
        id: fixture.categories.development.id,
        data: { slug: 'professional-development' },
      })
    }
  })

  it('applies access rules to anonymous callers on every source it reads', async () => {
    const posts = await payload.find({
      collection: 'posts',
      overrideAccess: false,
      draft: false,
      depth: 0,
    })
    expect(posts.docs.map((p) => p.id)).not.toContain(fixture.posts.draft.id)
    await expect(
      payload.create({
        collection: 'pages',
        overrideAccess: false,
        data: {
          title: 'Anonymous',
          slug: 'anonymous-events-test',
          hero: { type: 'none' },
          layout: [],
        },
      }),
    ).rejects.toMatchObject({ status: 403 })
  })
})
