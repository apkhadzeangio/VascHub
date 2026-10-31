import { describe, expect, it } from 'vitest'
import { classifyDay, formatDay, parseStructuredDay, tbilisiDay } from '@/Events/dates'
import {
  PAGE_SIZE,
  applyFilters,
  eventsURL,
  matchesQuery,
  parseEventFilters,
  sortItems,
} from '@/Events/filters'
import { canonicalOf, classifyHref } from '@/Events/links'
import type { EventFilters, EventItem } from '@/Events/types'

const NOW = new Date('2026-10-29T10:00:00Z') // 14:00 in Tbilisi

function item(overrides: Partial<EventItem> & { key: string }): EventItem {
  return {
    source: 'post',
    title: overrides.key,
    description: null,
    types: ['events'],
    day: null,
    dateStatus: 'undated',
    location: null,
    link: { kind: 'internal', href: `/posts/${overrides.key}` },
    canonical: `/posts/${overrides.key}`,
    ...overrides,
  }
}
const none: EventFilters = { type: '', q: '', when: '', page: 1 }

describe('Tbilisi date handling', () => {
  it('uses the Tbilisi calendar day around UTC midnight', () => {
    expect(tbilisiDay(new Date('2026-10-28T21:00:00Z'))).toBe('2026-10-29')
    expect(tbilisiDay(new Date('2026-10-28T19:59:00Z'))).toBe('2026-10-28')
  })
  it('keeps today upcoming and treats the previous Tbilisi day as past', () => {
    expect(classifyDay(parseStructuredDay('2026-10-28T21:00:00Z'), NOW)).toBe('upcoming')
    expect(classifyDay(parseStructuredDay('2026-10-28T19:59:00Z'), NOW)).toBe('past')
    expect(classifyDay(parseStructuredDay('2026-12-01T09:00:00Z'), NOW)).toBe('upcoming')
  })
  it('never lets a missing or invalid date become an upcoming event or throw', () => {
    for (const bad of [
      undefined,
      null,
      '',
      '   ',
      'not-a-date',
      '2026-13-45',
      '2026-02-30T10:00:00.000Z',
      '2026-04-31',
      42,
      {},
      '0001-01-01',
      '9999-12-31',
    ]) {
      expect(parseStructuredDay(bad)).toBeNull()
    }
    expect(classifyDay(null, NOW)).toBe('undated')
    expect(tbilisiDay(new Date('invalid'))).toBeNull()
  })
  it('formats a stored day in Georgian without shifting the civil date', () => {
    expect(formatDay('2026-10-29')).toContain('29')
    expect(formatDay('2026-10-29')).toContain('2026')
  })
})

describe('link classification', () => {
  it('accepts post and library detail pages and normalises them', () => {
    expect(classifyHref('/posts/my-post')).toEqual({
      kind: 'post',
      slug: 'my-post',
      href: '/posts/my-post',
    })
    expect(classifyHref('/posts/my-post/')).toEqual({
      kind: 'post',
      slug: 'my-post',
      href: '/posts/my-post',
    })
    expect(classifyHref('/library/guide-1')).toMatchObject({ kind: 'library', slug: 'guide-1' })
    expect(classifyHref('/posts/%E1%83%A1%E1%83%90%E1%83%A2')).toMatchObject({
      kind: 'post',
      slug: 'სატ',
    })
  })
  it('rejects unsafe, admin, malformed and unverifiable local targets', () => {
    for (const bad of [
      'javascript:alert(1)',
      'data:text/html,x',
      '//evil.example/x',
      '/admin',
      '/api/posts',
      '/posts/a b',
      '/posts/%E0%A4%A',
      '/posts/a/b',
      '/posts/x?draft=1',
      '/some-other-page',
      'https://user:pass@example.org/x',
      '',
      null,
      undefined,
    ]) {
      expect(classifyHref(bad as string | null | undefined)).toBeNull()
    }
  })
  it('treats other origins as external and normalises them for de-duplication', () => {
    const a = classifyHref('https://Example.org/congress/')
    const b = classifyHref('https://example.org/congress')
    expect(a).toMatchObject({ kind: 'external' })
    expect(canonicalOf(a!)).toBe(canonicalOf(b!))
    expect(canonicalOf(classifyHref('https://example.org/other')!)).not.toBe(canonicalOf(b!))
  })
})

describe('filters and URL state', () => {
  it('parses only known values and survives hostile input', () => {
    expect(
      parseEventFilters({ type: 'events', q: '  ESVS   2026 ', when: 'past', page: '3' }),
    ).toEqual({
      type: 'events',
      q: 'ESVS 2026',
      when: 'past',
      page: 3,
    })
    expect(parseEventFilters({ type: 'training', when: 'someday', page: '-4' })).toEqual(none)
    expect(
      parseEventFilters({ type: ['events', 'development'], q: ['a'], page: '99999999' }),
    ).toEqual(none)
    expect(parseEventFilters({ q: 'x'.repeat(500) }).q).toHaveLength(160)
  })
  it('round-trips filters through the address bar', () => {
    expect(eventsURL()).toBe('/events')
    const url = eventsURL({ type: 'events', q: 'სატესტო კონგრესი', when: 'upcoming', page: 2 })
    const params = Object.fromEntries(new URL(url, 'http://x').searchParams)
    expect(parseEventFilters(params)).toEqual({
      type: 'events',
      q: 'სატესტო კონგრესი',
      when: 'upcoming',
      page: 2,
    })
    expect(eventsURL({ page: 1 })).toBe('/events')
  })
  it('requires every search word and ignores case in Latin text', () => {
    const entry = item({
      key: 'a',
      title: 'ESVS კონგრესი',
      description: 'სისხლძარღვები',
      location: 'ვენა',
    })
    expect(matchesQuery(entry, 'esvs ვენა')).toBe(true)
    expect(matchesQuery(entry, 'ESVS პარიზი')).toBe(false)
    expect(matchesQuery(entry, '')).toBe(true)
  })
})

describe('ordering, counts and pagination', () => {
  const all = [
    item({ key: 'undated-b', title: 'ბ ჩანაწერი' }),
    item({ key: 'past-new', day: '2026-09-01', dateStatus: 'past' }),
    item({ key: 'future-late', day: '2027-03-01', dateStatus: 'upcoming' }),
    item({ key: 'undated-a', title: 'ა ჩანაწერი', types: ['development'] }),
    item({ key: 'future-soon', day: '2026-11-15', dateStatus: 'upcoming' }),
    item({ key: 'past-old', day: '2025-01-01', dateStatus: 'past' }),
  ]
  it('orders upcoming, then undated, then past — and never calls undated "upcoming"', () => {
    expect(sortItems(all).map((i) => i.key)).toEqual([
      'future-soon',
      'future-late',
      'undated-a',
      'undated-b',
      'past-new',
      'past-old',
    ])
  })
  it('filters by type, date state and keeps counts independent of the type filter', () => {
    const events = applyFilters(all, { ...none, type: 'events' })
    expect(events.items.map((i) => i.key)).not.toContain('undated-a')
    expect(events.counts).toEqual({ all: 6, events: 5, development: 1 })
    const undated = applyFilters(all, { ...none, when: 'undated' })
    expect(undated.items.map((i) => i.key)).toEqual(['undated-a', 'undated-b'])
    expect(applyFilters(all, { ...none, q: 'future-soon' }).total).toBe(1)
  })
  it('offers the date filter only when valid structured dates exist', () => {
    expect(applyFilters(all, none).hasDatedItems).toBe(true)
    expect(
      applyFilters(
        all.filter((i) => i.dateStatus === 'undated'),
        none,
      ).hasDatedItems,
    ).toBe(false)
  })
  it('paginates and clamps out-of-range pages', () => {
    const many = Array.from({ length: PAGE_SIZE + 3 }, (_, n) =>
      item({ key: `n${String(n).padStart(2, '0')}`, title: `n${String(n).padStart(2, '0')}` }),
    )
    const first = applyFilters(many, none)
    expect(first.items).toHaveLength(PAGE_SIZE)
    expect(first.totalPages).toBe(2)
    expect(applyFilters(many, { ...none, page: 2 }).items).toHaveLength(3)
    expect(applyFilters(many, { ...none, page: 50 }).page).toBe(2)
  })
  it('returns an honest empty result', () => {
    const empty = applyFilters([], none)
    expect(empty).toMatchObject({ total: 0, totalPages: 0, page: 1, hasDatedItems: false })
    expect(applyFilters(all, { ...none, q: 'არარსებული' }).items).toEqual([])
  })
})
