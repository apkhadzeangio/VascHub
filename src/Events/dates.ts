import type { DateStatus } from './types'

const TIME_ZONE = 'Asia/Tbilisi'
const MIN_YEAR = 1900
const MAX_YEAR = 2100

const dayFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Returns the Tbilisi calendar day (YYYY-MM-DD) of an instant, or null for an invalid one. */
export function tbilisiDay(date: Date): string | null {
  if (Number.isNaN(date.getTime())) return null
  try {
    const day = dayFormat.format(date)
    const year = Number(day.slice(0, 4))
    return /^\d{4}-\d{2}-\d{2}$/.test(day) && year >= MIN_YEAR && year <= MAX_YEAR ? day : null
  } catch {
    return null
  }
}

/**
 * Parses a structured CMS date. Anything that is not a real, plausible date yields null,
 * so a malformed value can never break the page or masquerade as an upcoming event.
 */
export function parseStructuredDay(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null
  // Date parsing can silently roll an impossible day (e.g. 30 February) into the next month.
  // Same rule as the homepage notices (src/Homepage/events.ts): such a date is invalid.
  const calendar = /^(\d{4})-(\d{2})-(\d{2})(?:T|$)/.exec(value.trim())
  if (calendar) {
    const check = new Date(`${calendar[1]}-${calendar[2]}-${calendar[3]}T00:00:00Z`)
    if (Number.isNaN(check.getTime()) || check.getUTCDate() !== Number(calendar[3])) return null
  }
  return tbilisiDay(new Date(value))
}

/** A missing or invalid date is "undated" — never upcoming. */
export function classifyDay(day: string | null, now = new Date()): DateStatus {
  if (!day) return 'undated'
  const today = tbilisiDay(now)
  if (!today) return 'undated'
  return day >= today ? 'upcoming' : 'past'
}

const dateLabelFormat = new Intl.DateTimeFormat('ka-GE', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: TIME_ZONE,
})

/** Formats a Tbilisi calendar day for display. Noon UTC keeps the same civil date in Tbilisi. */
export function formatDay(day: string): string {
  return dateLabelFormat.format(new Date(`${day}T12:00:00Z`))
}
