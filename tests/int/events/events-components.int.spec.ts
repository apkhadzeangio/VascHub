// @vitest-environment jsdom
import { createElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { EventCard } from '@/components/events/EventCard'
import EventsError from '@/app/(frontend)/events/error'
import Loading from '@/app/(frontend)/events/loading'
import type { EventItem } from '@/Events/types'

afterEach(cleanup)

function card(overrides: Partial<EventItem>) {
  const item: EventItem = {
    key: 'x',
    source: 'post',
    title: 'სატესტო სათაური',
    description: null,
    types: ['events'],
    day: null,
    dateStatus: 'undated',
    location: null,
    link: { kind: 'internal', href: '/posts/test' },
    canonical: '/posts/test',
    ...overrides,
  }
  return render(createElement(EventCard, { item })).container
}

describe('EventCard', () => {
  it('shows "date to be confirmed" and no place for an item without structured data', () => {
    const view = card({})
    expect(view.textContent).toContain('თარიღი დასაზუსტებელია')
    expect(view.querySelector('time')).toBeNull()
    expect(view.textContent).not.toContain('ჩატარებულია')
    const link = view.querySelector('a')!
    expect(link.getAttribute('href')).toBe('/posts/test')
    expect(link.getAttribute('target')).toBeNull()
  })

  it('renders a confirmed date and place, and marks a past item', () => {
    const view = card({
      day: '2026-09-10',
      dateStatus: 'past',
      location: 'სატესტო ქალაქი',
      link: { kind: 'external', href: 'https://example.org/x' },
    })
    expect(view.querySelector('time')?.getAttribute('datetime')).toBe('2026-09-10')
    expect(view.textContent).toContain('სატესტო ქალაქი')
    expect(view.textContent).toContain('ჩატარებულია')
    expect(view.textContent).not.toContain('თარიღი დასაზუსტებელია')
  })

  it('opens external pages in a new window with a safe rel and announces it', () => {
    const view = card({ link: { kind: 'external', href: 'https://example.org/x' } })
    const link = view.querySelector('a')!
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    expect(link.textContent).toContain('იხსნება ახალ ფანჯარაში')
  })

  it('labels professional development generically and never as training', () => {
    const view = card({ types: ['development'] })
    expect(view.textContent).toContain('პროფესიული განვითარება')
    expect(view.textContent).not.toContain('ტრენინგ')
  })
})

describe('loading and error states', () => {
  it('announces loading politely', () => {
    const view = render(createElement(Loading)).container
    const status = view.querySelector('[role="status"]')!
    expect(status.getAttribute('aria-busy')).toBe('true')
    expect(status.textContent).toContain('ღონისძიებები იტვირთება')
  })

  it('reports an error as an alert and lets the visitor retry', () => {
    const reset = vi.fn()
    const view = render(createElement(EventsError, { error: new Error('boom'), reset })).container
    expect(view.querySelector('[role="alert"]')?.textContent).toContain('დროებით ვერ მოხერხდა')
    expect(view.textContent).not.toContain('boom')
    fireEvent.click(view.querySelector('button')!)
    expect(reset).toHaveBeenCalledTimes(1)
  })
})
