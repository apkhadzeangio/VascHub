import { describe, expect, it } from 'vitest'
import { upcomingEvents } from '@/Homepage/events'
import { publicHref } from '@/Homepage/defaults'

describe('Event notices remain usable with legacy or malformed dates', () => {
  it('discards invalid dates without taking down valid and undated notices', () => {
    const events = [
      { id: 'invalid', date: 'not-a-date' },
      { id: 'valid', date: '2026-10-30T10:00:00Z' },
      { id: 'undated', date: null },
    ]
    expect(upcomingEvents(events, new Date('2026-10-29T12:00:00Z')).map((e) => e.id)).toEqual([
      'valid',
      'undated',
    ])
    expect(events[0].id).toBe('invalid')
  })

  it('does not silently roll an impossible calendar date into the next month', () => {
    expect(upcomingEvents([{ date: '2026-02-30' }], new Date('2026-02-01T00:00:00Z'))).toEqual([])
  })

  it('orders offset timestamps by their actual time rather than their spelling', () => {
    const events = [
      { id: 'later', date: '2026-10-30T08:00:00Z' },
      { id: 'earlier', date: '2026-10-30T10:00:00+04:00' },
    ]
    expect(upcomingEvents(events, new Date('2026-10-29T00:00:00Z')).map((e) => e.id)).toEqual([
      'earlier',
      'later',
    ])
  })

  it('keeps the current Georgian calendar day near midnight, with undated notices last', () => {
    const events = [
      { id: 'undated', date: '' },
      { id: 'yesterday', date: '2026-10-28T19:59:59Z' },
      { id: 'today', date: '2026-10-28T20:00:00Z' },
    ]
    expect(upcomingEvents(events, new Date('2026-10-28T20:30:00Z')).map((e) => e.id)).toEqual([
      'today',
      'undated',
    ])
  })
})

describe('Public CMS links after URL normalization', () => {
  it.each([
    '/public/../admin',
    '/public/../api/users',
    '/public/../next/preview',
    '/%61dmin',
    '/%2e%2e/admin',
    '/%2fexample.com',
    '/%5cadmin',
    '/%00admin',
    '/admin?view=posts',
    '/api',
    '//example.com',
    '//vaschub.invalid',
    'javascript:alert(1)',
    'https://user:password@example.com',
    '/malformed%ZZ',
  ])('rejects a non-public or malformed local target: %s', (value) => {
    expect(publicHref(value)).toBeUndefined()
  })

  it.each([
    '/',
    '/library?q=PAD',
    '/posts/example#sources',
    '/posts/clinical%20notes',
    '/administration-guide',
    '/%E1%83%97%E1%83%94%E1%83%9B%E1%83%90',
    'https://esvs.org/education/',
  ])('preserves valid public links: %s', (value) => {
    expect(publicHref(value)).toBe(value)
  })
})
