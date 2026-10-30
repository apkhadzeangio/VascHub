import type { Payload } from 'payload'
import type { Redirect } from '@/payload-types'
import { publicHref } from '@/Homepage/defaults'
import { getPublicReference } from './getPublicReference'
import { getServerSideURL } from './getURL'

export async function resolveRedirect(payload: Payload, to: Redirect['to'], from: string) {
  const target =
    to?.type === 'custom'
      ? publicHref(to.url)
      : to?.type === 'reference'
        ? await getPublicReference(payload, to.reference)
        : undefined
  if (!target) return undefined
  const origin = getServerSideURL()
  const destination = new URL(target, origin)
  const source = new URL(from, origin)
  // Query/fragment-only changes cannot escape a path-based redirect loop.
  if (destination.origin === source.origin && destination.pathname === source.pathname)
    return undefined
  return target
}
