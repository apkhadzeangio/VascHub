'use client'
import React from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { Header } from '@/payload-types'
import { SiteAvailabilityButton as AvailabilityButton } from '@/components/site-ui/Dialog'
import { navigationHref } from '@/components/site-ui/NavigationLink'
const defaults = [
  { label: 'კლინიკური ბიბლიოთეკა', href: '/library' },
  { label: 'აკადემია', href: '/#academy' },
  { label: 'ღონისძიებები', href: '/events' },
  { label: 'პროფესიული ქსელი', href: '/specialists' },
  { label: 'სტატიები და სიახლეები', href: '/posts' },
  { label: 'ჩვენ შესახებ / წევრობა', href: '/#about' },
]
export function navigationItems(data: Header) {
  if (!data.navItems?.length) return defaults
  const items = data.navItems.map(({ link }) => {
    const href = navigationHref(link)
    return {
      label: link.label,
      href:
        link.label === 'ღონისძიებები' && href === '/#events'
          ? '/events'
          : link.label === 'პროფესიული ქსელი' && !href
            ? '/specialists'
            : href,
      newTab: link.newTab,
    }
  })
  for (const entry of [defaults[0], defaults[2], defaults[3]]) {
    if (!items.some((item) => item.href === entry.href || item.label === entry.label))
      items.push({ ...entry, newTab: false })
  }
  return items
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
