import type { EventFilters, EventItem, EventTypeKey, WhenFilter } from './types'

export const PAGE_SIZE = 12

export const eventTypes: { value: EventTypeKey; label: string; categorySlug: string }[] = [
  { value: 'events', label: 'ღონისძიებები', categorySlug: 'international-events' },
  {
    value: 'development',
    label: 'პროფესიული განვითარება',
    categorySlug: 'professional-development',
  },
]

export const whenOptions: { value: Exclude<WhenFilter, ''>; label: string }[] = [
  { value: 'upcoming', label: 'მომავალი' },
  { value: 'past', label: 'ჩატარებული' },
  { value: 'undated', label: 'თარიღი დასაზუსტებელია' },
]

type Params = Record<string, string | string[] | undefined>
const scalar = (value: string | string[] | undefined) => (typeof value === 'string' ? value : '')

/** Reads URL parameters defensively: unknown or malformed values fall back to "no filter". */
export function parseEventFilters(params: Params): EventFilters {
  const type = scalar(params.type)
  const when = scalar(params.when)
  const page = scalar(params.page)
  return {
    type: eventTypes.some((t) => t.value === type) ? (type as EventTypeKey) : '',
    q: scalar(params.q).normalize('NFC').replace(/\s+/g, ' ').trim().slice(0, 160),
    when: whenOptions.some((w) => w.value === when) ? (when as WhenFilter) : '',
    page: /^\d{1,5}$/.test(page) ? Math.max(1, Number(page)) : 1,
  }
}

export function eventsURL(filters: Partial<EventFilters> = {}) {
  const params = new URLSearchParams()
  if (filters.type) params.set('type', filters.type)
  if (filters.q) params.set('q', filters.q)
  if (filters.when) params.set('when', filters.when)
  if (filters.page && filters.page > 1) params.set('page', String(filters.page))
  return `/events${params.size ? `?${params}` : ''}`
}

const fold = (value: string) => value.normalize('NFC').toLowerCase()

/** Every search word must appear in the title, description or place. */
export function matchesQuery(item: EventItem, q: string) {
  const terms = fold(q).split(' ').filter(Boolean)
  if (!terms.length) return true
  const haystack = fold([item.title, item.description, item.location].filter(Boolean).join(' '))
  return terms.every((term) => haystack.includes(term))
}

/** Upcoming (soonest first), then undated (alphabetical), then past (most recent first). */
export function sortItems(items: EventItem[]): EventItem[] {
  const rank = { upcoming: 0, undated: 1, past: 2 } as const
  return [...items].sort((a, b) => {
    if (rank[a.dateStatus] !== rank[b.dateStatus]) return rank[a.dateStatus] - rank[b.dateStatus]
    if (a.dateStatus === 'upcoming' && a.day !== b.day)
      return (a.day ?? '').localeCompare(b.day ?? '')
    if (a.dateStatus === 'past' && a.day !== b.day) return (b.day ?? '').localeCompare(a.day ?? '')
    return a.title.localeCompare(b.title, 'ka') || a.key.localeCompare(b.key)
  })
}

export type EventResults = {
  items: EventItem[]
  total: number
  page: number
  totalPages: number
  /** Counts for the type tabs, honouring search and date filters but not the type itself. */
  counts: Record<'all' | EventTypeKey, number>
  /** Date filter is only offered when at least one item carries a valid structured date. */
  hasDatedItems: boolean
}

export function applyFilters(all: EventItem[], filters: EventFilters): EventResults {
  const base = all.filter(
    (item) => matchesQuery(item, filters.q) && (!filters.when || item.dateStatus === filters.when),
  )
  const filtered = sortItems(
    base.filter((item) => !filters.type || item.types.includes(filters.type)),
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const page = Math.min(filters.page, totalPages)
  return {
    items: filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    total: filtered.length,
    page,
    totalPages: filtered.length ? totalPages : 0,
    counts: {
      all: base.length,
      events: base.filter((i) => i.types.includes('events')).length,
      development: base.filter((i) => i.types.includes('development')).length,
    },
    hasDatedItems: all.some((item) => item.dateStatus !== 'undated'),
  }
}
