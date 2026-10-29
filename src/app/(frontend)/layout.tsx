import type { Metadata } from 'next'

import { cn } from '@/utilities/ui'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import React from 'react'
import localFont from 'next/font/local'

import { AdminBar } from '@/components/AdminBar'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { draftMode } from 'next/headers'

import './globals.css'
import '@/Homepage/styles.css'
import '@/Library/styles.css'
import { getServerSideURL } from '@/utilities/getURL'

const notoGeorgian = localFont({
  src: '../../fonts/NotoSansGeorgian.ttf',
  variable: '--font-noto-georgian',
  weight: '100 900',
  display: 'swap',
})

// CMS data is loaded at runtime; container builds do not need database access.
export const dynamic = 'force-dynamic'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode()

  return (
    <html
      className={cn(GeistSans.variable, GeistMono.variable, notoGeorgian.variable)}
      lang="ka"
      suppressHydrationWarning
    >
      <head>
        <InitTheme />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
      </head>
      <body>
        <Providers>
          <AdminBar
            adminBarProps={{
              preview: isEnabled,
            }}
          />

          <Header />
          <div id="main-content" tabIndex={-1} className="vh-page-content">
            {children}
          </div>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
  },
}
