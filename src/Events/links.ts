import { publicHref } from '@/Homepage/defaults'
import type { EventLink } from './types'

/** What a curated link points at, before its availability has been verified. */
export type LinkTarget =
  | { kind: 'post'; slug: string; href: string }
  | { kind: 'library'; slug: string; href: string }
  | { kind: 'external'; href: string }

function siteOrigin(): string | null {
  try {
    return process.env.NEXT_PUBLIC_SERVER_URL
      ? new URL(process.env.NEXT_PUBLIC_SERVER_URL).origin
      : null
  } catch {
    return null
  }
}

function internalTarget(pathname: string): LinkTarget | null {
  const match = /^\/(posts|library)\/([^/?#]+)\/?$/.exec(pathname)
  if (!match) return null
  let slug: string
  try {
    slug = decodeURIComponent(match[2])
  } catch {
    return null
  }
  if (!slug || /[/\\]/.test(slug)) return null
  const kind = match[1] === 'posts' ? 'post' : 'library'
  return { kind, slug, href: `/${match[1]}/${encodeURIComponent(slug)}` }
}

/**
 * Classifies a curated URL using the site's existing safe-link rule (`publicHref`).
 * Internal links are only trusted when they point at a Post or Library detail page,
 * because only those can be checked for public availability. Other local paths are rejected.
 * Absolute links to this site's own origin are treated as internal so they de-duplicate.
 */
export function classifyHref(value: string | null | undefined): LinkTarget | null {
  const href = publicHref(value)
  if (!href) return null
  if (href.startsWith('/')) return /[?#]/.test(href) ? null : internalTarget(href)
  const url = new URL(href)
  if (siteOrigin() && url.origin === siteOrigin()) {
    return url.search || url.hash ? null : internalTarget(url.pathname)
  }
  return { kind: 'external', href: url.href }
}

export function toEventLink(target: LinkTarget): EventLink {
  return target.kind === 'external'
    ? { kind: 'external', href: target.href }
    : { kind: 'internal', href: target.href }
}

/** Canonical key for de-duplication: internal path, or origin + path of an external URL. */
export function canonicalOf(target: LinkTarget): string {
  if (target.kind !== 'external') return target.href
  const url = new URL(target.href)
  const path = url.pathname.replace(/\/+$/, '')
  return `${url.protocol}//${url.host.toLowerCase()}${path}${url.search}`
}
