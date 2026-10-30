import type { Header } from '@/payload-types'
import { publicHref } from '@/Homepage/defaults'

type NavigationLink = NonNullable<Header['navItems']>[number]['link']

/** Resolve the configured destination without silently substituting another section. */
export function navigationHref(link: NavigationLink): string | undefined {
  if (link.type === 'custom') return publicHref(link.url)
  if (link.type !== 'reference') return undefined
  const document = link.reference?.value
  if (!document || typeof document !== 'object' || !document.slug) return undefined
  if (document._status === 'draft') return undefined
  return link.reference?.relationTo === 'posts'
    ? `/posts/${encodeURIComponent(document.slug)}`
    : document.slug === 'home'
      ? '/'
      : `/${encodeURIComponent(document.slug)}`
}
