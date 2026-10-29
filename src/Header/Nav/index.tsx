'use client'
import React from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { Header } from '@/payload-types'
import { AvailabilityButton } from '@/components/Modal'
import { publicHref } from '@/Homepage/defaults'
const defaults = [
  { label: 'კლინიკური ბიბლიოთეკა', href: '/library' },
  { label: 'აკადემია', href: '/#academy' },
  { label: 'ღონისძიებები', href: '/#events' },
  { label: 'პროფესიული ქსელი', href: undefined },
  { label: 'სტატიები და სიახლეები', href: '/posts' },
  { label: 'ჩვენ შესახებ / წევრობა', href: '/#about' },
]
export function navigationItems(data: Header) {
  if (!data.navItems?.length) return defaults
  const items = data.navItems.map(({ link }) => {
    const reference = link.reference?.value
    const slug = reference && typeof reference === 'object' ? reference.slug : undefined
    const href =
      link.type === 'reference' && slug
        ? link.reference?.relationTo === 'posts'
          ? `/posts/${encodeURIComponent(slug)}`
          : slug === 'home'
            ? '/'
            : `/${encodeURIComponent(slug)}`
        : link.type === 'custom'
          ? publicHref(link.url === '/#resources' ? '/library' : link.url)
          : undefined
    return { label: link.label, href, newTab: link.newTab }
  })
  return items.some((item) => item.href === '/library')
    ? items
    : [{ label: 'კლინიკური ბიბლიოთეკა', href: '/library' }, ...items]
}
export function HeaderNav({
  data,
  className = '',
  onNavigate,
}: {
  data: Header
  className?: string
  onNavigate?: () => void
}) {
  return (
    <nav aria-label="ძირითადი ნავიგაცია" className={className}>
      <ul className="vh-nav-list">
        {navigationItems(data).map((item, index) => (
          <li key={index}>
            {item.href ? (
              <Link
                href={item.href}
                onClick={onNavigate}
                {...('newTab' in item && item.newTab
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
              >
                {item.label}
                <ChevronRight size={18} className="vh-menu-chevron" aria-hidden="true" />
              </Link>
            ) : (
              <AvailabilityButton
                title={item.label}
                message="ეს მიმართულება მზადდება. ინფორმაცია ხელმისაწვდომი გახდება მოგვიანებით."
              >
                {item.label}
                <span className="vh-soon">მალე</span>
              </AvailabilityButton>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}
