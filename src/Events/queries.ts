import type { Payload } from 'payload'
import type { Page } from '@/payload-types'
import { findPublicResource } from '@/Library/queries'
import { classifyDay, parseStructuredDay } from './dates'
import { eventTypes } from './filters'
import { canonicalOf, classifyHref, toEventLink, type LinkTarget } from './links'
import type { EventItem, EventTypeKey } from './types'

/** MVP safety cap on Posts read per request; see docs/events-training/README.md. */
export const MAX_POSTS = 1000

type HomepageEvent = NonNullable<NonNullable<Page['homepage']>['events']>[number]

const clean = (value: string | null | undefined, max: number) => {
  const text = (value ?? '').replace(/\s+/g, ' ').trim()
  return text ? text.slice(0, max) : null
}

const postCanonical = (slug: string) => `/posts/${encodeURIComponent(slug)}`

/**
 * Loads every public Event / Professional Development item.
 *
 * Sources are read through the Local API with `overrideAccess: false`, `draft: false` and no
 * `user`, so access rules apply exactly as for an anonymous visitor: an admin session or a
 * preview cookie can never surface a draft here. Nothing in this module reads `draftMode()`.
 */
export async function loadEventItems(payload: Payload, now = new Date()): Promise<EventItem[]> {
  const slugs = eventTypes.map((t) => t.categorySlug)

  // Categories are resolved by slug, never by a hard-coded database id.
  const categories = await payload.find({
    collection: 'categories',
    overrideAccess: false,
    depth: 0,
    pagination: false,
    where: { slug: { in: slugs } },
    select: { slug: true },
  })
  const typeByCategory = new Map<number, EventTypeKey>()
  for (const category of categories.docs) {
    const type = eventTypes.find((t) => t.categorySlug === category.slug)
    if (type) typeByCategory.set(category.id, type.value)
  }

  const [posts, home] = await Promise.all([
    typeByCategory.size
      ? payload.find({
          collection: 'posts',
          overrideAccess: false,
          draft: false,
          depth: 0,
          limit: MAX_POSTS,
          pagination: false,
          where: {
            and: [
              { _status: { equals: 'published' } },
              { categories: { in: [...typeByCategory.keys()] } },
            ],
          },
          select: { title: true, slug: true, meta: { description: true }, categories: true },
        })
      : Promise.resolve(null),
    payload.find({
      collection: 'pages',
      overrideAccess: false,
      draft: false,
      depth: 0,
      limit: 1,
      pagination: false,
      where: { and: [{ slug: { equals: 'home' } }, { _status: { equals: 'published' } }] },
      select: { homepage: { events: true } },
    }),
  ])

  const byCanonical = new Map<string, EventItem>()

  for (const post of posts?.docs ?? []) {
    const title = clean(post.title, 300)
    if (!title || !post.slug) continue
    const types = new Set<EventTypeKey>()
    for (const category of post.categories ?? []) {
      const id = typeof category === 'object' ? category.id : category
      const type = typeByCategory.get(id)
      if (type) types.add(type)
    }
    if (!types.size) continue
    const href = postCanonical(post.slug)
    byCanonical.set(href, {
      key: `post-${post.id}`,
      source: 'post',
      title,
      description: clean(post.meta?.description, 400),
      types: eventTypes.map((t) => t.value).filter((t) => types.has(t)),
      // Posts carry no structured event date: never infer one from the title, the body or
      // the publication / update timestamps.
      day: null,
      dateStatus: 'undated',
      location: null,
      link: { kind: 'internal', href },
      canonical: href,
    })
  }

  // Short notices curated on the homepage. They are the only source of structured dates.
  const rows: { row: HomepageEvent; target: LinkTarget }[] = []
  for (const row of home.docs[0]?.homepage?.events ?? []) {
    const target = classifyHref(row.url)
    if (clean(row.title, 300) && target) rows.push({ row, target })
  }

  // Internal targets must resolve to something an anonymous visitor can open right now.
  const postSlugs = [
    ...new Set(rows.flatMap(({ target }) => (target.kind === 'post' ? [target.slug] : []))),
  ]
  const reachablePosts = new Map<string, { description: string | null }>()
  if (postSlugs.length) {
    const found = await payload.find({
      collection: 'posts',
      overrideAccess: false,
      draft: false,
      depth: 0,
      pagination: false,
      limit: postSlugs.length,
      where: { and: [{ _status: { equals: 'published' } }, { slug: { in: postSlugs } }] },
      select: { slug: true, meta: { description: true } },
    })
    for (const doc of found.docs)
      if (doc.slug) reachablePosts.set(doc.slug, { description: clean(doc.meta?.description, 400) })
  }
  const reachableLibrary = new Set<string>()
  for (const slug of new Set(
    rows.flatMap(({ target }) => (target.kind === 'library' ? [target.slug] : [])),
  ))
    if (await findPublicResource(payload, slug)) reachableLibrary.add(slug)

  for (const { row, target } of rows) {
    if (target.kind === 'post' && !reachablePosts.has(target.slug)) continue
    if (target.kind === 'library' && !reachableLibrary.has(target.slug)) continue

    const day = parseStructuredDay(row.date)
    const location = clean(row.location, 120)
    const canonical = canonicalOf(target)
    const existing = byCanonical.get(canonical)

    if (existing) {
      // Same item reached through a reliable link: enrich the Post card instead of duplicating it.
      if (existing.source === 'post') {
        if (!existing.types.includes('events'))
          existing.types = eventTypes
            .map((t) => t.value)
            .filter((value) => value === 'events' || existing.types.includes(value))
        if (!existing.day && day) {
          existing.day = day
          existing.dateStatus = classifyDay(day, now)
        }
        if (!existing.location && location) existing.location = location
      }
      continue
    }

    byCanonical.set(canonical, {
      key: `home-${row.id ?? canonical}`,
      source: 'homepage',
      title: clean(row.title, 300)!,
      description:
        target.kind === 'post' ? (reachablePosts.get(target.slug)?.description ?? null) : null,
      types: ['events'],
      day,
      dateStatus: classifyDay(day, now),
      location,
      link: toEventLink(target),
      canonical,
    })
  }

  return [...byCanonical.values()]
}
