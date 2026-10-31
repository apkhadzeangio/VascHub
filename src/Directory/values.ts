export type DirectoryKind = 'specialists' | 'centres'
export type SearchParams = Record<string, string | string[] | undefined>
export type DirectoryFilters = {
  q: string
  city: string
  specialization: string
  centre: string
  page: number
}
const scalar = (v: string | string[] | undefined, n = 160) =>
  typeof v === 'string' ? v.normalize('NFC').trim().slice(0, n) : ''
export function parseDirectoryFilters(p: SearchParams): DirectoryFilters {
  const page = scalar(p.page)
  return {
    q: scalar(p.q).toLowerCase(),
    city: scalar(p.city, 120),
    specialization: scalar(p.specialization),
    centre: scalar(p.centre, 180),
    page: /^[1-9]\d{0,5}$/.test(page) ? Math.min(10000, Number(page)) : 1,
  }
}
export function directoryURL(kind: DirectoryKind, filters: Partial<DirectoryFilters> = {}) {
  const p = new URLSearchParams()
  for (const key of ['q', 'city', 'specialization', 'centre', 'page'] as const) {
    if (kind === 'centres' && (key === 'specialization' || key === 'centre')) continue
    const v = filters[key]
    if (v && !(key === 'page' && v === 1)) p.set(key, String(v))
  }
  return `/${kind}${p.size ? `?${p}` : ''}`
}
export const profileURL = (kind: DirectoryKind, p: { slug: string }) =>
  `/${kind}/${encodeURIComponent(p.slug)}`
export function publicWebsite(v: unknown): string | undefined {
  if (typeof v !== 'string' || /[\u0000-\u0020\\]/.test(v)) return undefined
  try {
    const u = new URL(v)
    if (u.protocol === 'https:' && !u.username && !u.password) return u.href
  } catch {
    /* Invalid URLs never become links. */
  }
}
export function decodeSlug(v: string) {
  try {
    const s = decodeURIComponent(v).normalize('NFC')
    return s.length <= 180 && /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u.test(s) ? s : null
  } catch {
    return null
  }
}
