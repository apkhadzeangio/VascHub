import type { Payload } from 'payload'
import { assertTestDatabase, demoContent, fixtureContext } from '../../helpers/homepageFixture'

/** Synthetic fixtures for the Events & Training section. Only ever written to a *_test database. */
export const EVENTS_CATEGORY = 'international-events'
export const DEVELOPMENT_CATEGORY = 'professional-development'

type HomeEvent = { title: string; date?: string; location?: string; url: string }
type Created = { collection: 'posts' | 'pages' | 'categories'; id: number }[]

const stamp = () => `${Date.now()}-${Math.floor(Math.random() * 1e4)}`

async function ensureCategory(payload: Payload, created: Created, slug: string, title: string) {
  const existing = await payload.find({
    collection: 'categories',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  if (existing.docs[0]) return existing.docs[0]
  const doc = await payload.create({ collection: 'categories', data: { title, slug } })
  created.push({ collection: 'categories', id: doc.id })
  return doc
}

async function createPost(
  payload: Payload,
  created: Created,
  data: { title: string; categories?: number[]; description?: string; draft?: boolean },
) {
  const post = await payload.create({
    collection: 'posts',
    context: fixtureContext,
    draft: Boolean(data.draft),
    data: {
      title: data.title,
      slug: `events-fixture-${stamp()}`,
      content: demoContent,
      _status: data.draft ? 'draft' : 'published',
      categories: data.categories ?? [],
      meta: data.description ? { description: data.description } : undefined,
    },
  })
  created.push({ collection: 'posts', id: post.id })
  return post
}

async function deleteCreated(payload: Payload, created: Created) {
  for (const { collection, id } of [...created].reverse())
    await payload.delete({ collection, id, context: fixtureContext }).catch(() => undefined)
}

/**
 * Seeds categories, Posts and a homepage. If anything fails half-way, everything created so far
 * is removed again, so a failed run cannot pollute the next one.
 */
export async function seedEventsFixture(
  payload: Payload,
  options: { extraDevelopment?: number } = {},
) {
  assertTestDatabase()
  const created: Created = []
  try {
    const events = await ensureCategory(
      payload,
      created,
      EVENTS_CATEGORY,
      'საერთაშორისო ღონისძიებები',
    )
    const development = await ensureCategory(
      payload,
      created,
      DEVELOPMENT_CATEGORY,
      'პროფესიული განვითარება',
    )
    const other = await payload.create({
      collection: 'categories',
      data: { title: 'სხვა თემა', slug: `events-fixture-other-${stamp()}` },
    })
    created.push({ collection: 'categories', id: other.id })

    const congress = await createPost(payload, created, {
      title: 'სატესტო საერთაშორისო კონგრესი',
      categories: [events.id],
      description: 'კონგრესის სინთეტიკური აღწერა ინტერფეისის შესამოწმებლად.',
    })
    const workshop = await createPost(payload, created, {
      title: 'სატესტო პრაქტიკული ტრენინგი',
      categories: [development.id],
      description: 'ტრენინგის სინთეტიკური აღწერა.',
    })
    const fellowship = await createPost(payload, created, {
      title: 'სატესტო Fellowship შესაძლებლობა',
      categories: [development.id],
    })
    const both = await createPost(payload, created, {
      title: 'სატესტო ორმხრივი ჩანაწერი',
      categories: [events.id, development.id],
    })
    const unrelated = await createPost(payload, created, {
      title: 'სატესტო უკავშირო სტატია',
      categories: [other.id],
    })
    const draft = await createPost(payload, created, {
      title: 'სატესტო დაფარული ღონისძიება',
      categories: [events.id],
      draft: true,
    })
    const extra = []
    for (let index = 1; index <= (options.extraDevelopment ?? 0); index += 1)
      extra.push(
        await createPost(payload, created, {
          title: `სატესტო განვითარების ჩანაწერი ${String(index).padStart(2, '0')}`,
          categories: [development.id],
        }),
      )

    const home = await payload.create({
      collection: 'pages',
      context: fixtureContext,
      data: {
        title: 'Events fixture home',
        slug: 'home',
        hero: { type: 'none' },
        layout: [{ blockType: 'content', columns: [{ size: 'full' }] }],
        _status: 'published',
      },
    })
    created.push({ collection: 'pages', id: home.id })

    return {
      categories: { events, development, other },
      posts: { congress, workshop, fellowship, both, unrelated, draft, extra },
      home,
      created,
    }
  } catch (error) {
    await deleteCreated(payload, created)
    throw error
  }
}

export type EventsFixture = Awaited<ReturnType<typeof seedEventsFixture>>

/** Replaces the homepage notices and publishes them (the public page reads the published version). */
export async function setHomeEvents(payload: Payload, fixture: EventsFixture, events: HomeEvent[]) {
  await payload.update({
    collection: 'pages',
    id: fixture.home.id,
    context: fixtureContext,
    data: { _status: 'published', homepage: { events } },
  })
}

export async function cleanupEventsFixture(payload: Payload, fixture: EventsFixture) {
  await deleteCreated(payload, fixture.created)
}
