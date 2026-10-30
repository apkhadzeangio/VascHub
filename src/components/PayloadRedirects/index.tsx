import type React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { resolveRedirect } from '@/utilities/resolveRedirect'
import { getCachedRedirects } from '@/utilities/getRedirects'
import { notFound, redirect } from 'next/navigation'

interface Props {
  disableNotFound?: boolean
  url: string
}

/* This component helps us with SSR based dynamic redirects */
export const PayloadRedirects: React.FC<Props> = async ({ disableNotFound, url }) => {
  const redirects = await getCachedRedirects()()

  const redirectItem = redirects.find((redirect) => redirect.from === url)

  if (redirectItem) {
    const payload = await getPayload({ config: configPromise })
    const redirectUrl = await resolveRedirect(payload, redirectItem.to, url)
    if (redirectUrl) redirect(redirectUrl)
  }

  if (disableNotFound) return null

  notFound()
}
