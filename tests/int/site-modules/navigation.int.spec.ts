import { describe, expect, it } from 'vitest'
import { navigationItems } from '@/Header/Nav'
import type { Header } from '@/payload-types'

describe('integrated module navigation', () => {
  it('opens both new modules from an empty CMS navigation', () => {
    const items = navigationItems({ navItems: [] } as unknown as Header)
    expect(items.find((item) => item.label === 'ღონისძიებები')?.href).toBe('/events')
    expect(items.find((item) => item.label === 'პროფესიული ქსელი')?.href).toBe('/specialists')
  })
  it('updates the legacy event anchor while retaining other editorial destinations', () => {
    const items = navigationItems({
      navItems: [
        { link: { type: 'custom', label: 'ღონისძიებები', url: '/#events' } },
        { link: { type: 'custom', label: 'რესურსები', url: '/#resources' } },
        { link: { type: 'custom', label: 'მიუწვდომელი', url: '/admin' } },
      ],
    } as unknown as Header)
    expect(items.find((item) => item.label === 'ღონისძიებები')?.href).toBe('/events')
    expect(items.find((item) => item.label === 'რესურსები')?.href).toBe('/#resources')
    expect(items.find((item) => item.label === 'მიუწვდომელი')?.href).toBeUndefined()
    expect(items.filter((item) => item.href === '/specialists')).toHaveLength(1)
  })
  it('keeps explicitly configured destinations and avoids duplicate module links', () => {
    const items = navigationItems({
      navItems: [
        { link: { type: 'custom', label: 'ღონისძიებები', url: 'https://example.org/congress' } },
        { link: { type: 'custom', label: 'ცნობარი', url: '/specialists' } },
      ],
    } as unknown as Header)
    expect(items.find((item) => item.label === 'ღონისძიებები')?.href).toBe(
      'https://example.org/congress',
    )
    expect(items.filter((item) => item.href === '/specialists')).toHaveLength(1)
  })
})
