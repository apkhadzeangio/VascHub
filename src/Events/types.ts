/** Shared types for the public Events & Professional Development section. */

export type EventTypeKey = 'events' | 'development'
export type DateStatus = 'upcoming' | 'past' | 'undated'
export type WhenFilter = '' | 'upcoming' | 'past' | 'undated'

export type EventLink = { kind: 'internal'; href: string } | { kind: 'external'; href: string }

export type EventItem = {
  /** Stable, source-prefixed identifier used for React keys. */
  key: string
  source: 'post' | 'homepage'
  title: string
  description: string | null
  types: EventTypeKey[]
  /** Calendar day in Asia/Tbilisi (YYYY-MM-DD) or null when no valid structured date exists. */
  day: string | null
  dateStatus: DateStatus
  location: string | null
  link: EventLink
  /** Canonical URL used for de-duplicating the same item across sources. */
  canonical: string
}

export type EventFilters = {
  type: '' | EventTypeKey
  q: string
  when: WhenFilter
  page: number
}
