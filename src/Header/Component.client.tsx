'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useSyncExternalStore } from 'react'

import type { Header } from '@/payload-types'

import { Logo } from '@/components/Logo/Logo'
import { HeaderNav } from './Nav'

interface HeaderClientProps {
  data: Header
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data }) => {
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const pathname = usePathname()
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )

  useEffect(() => {
    setHeaderTheme(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return (
    <header
      className="container relative z-20   "
      {...(hydrated && headerTheme ? { 'data-theme': headerTheme } : {})}
    >
      <div className="py-8 flex justify-between">
        <Link href="/">
          <Logo loading="eager" priority="high" />
        </Link>
        <HeaderNav data={data} />
      </div>
    </header>
  )
}

const subscribe = () => () => {}
