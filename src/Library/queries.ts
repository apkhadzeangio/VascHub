import type { Payload, Where } from 'payload'
import { resourceLanguages, resourceTypes } from './options'

export type LibraryFilters = {
  q: string
  category: string
  type: string
  language: string
  year: string
  sort: string
  page: number
}
type Params = Record<string, string | string[] | undefined>
const scalar = (value: string | string[] | undefined) => (typeof value === 'string' ? value : '')

export function parseLibraryFilters(params: Params): LibraryFilters {
  const year = scalar(params.year)
  const page = scalar(params.page)
  return {
    q: scalar(params.q).trim().slice(0, 160),
    category: scalar(params.category).slice(0, 160),
    type: resourceTypes.some((t) => t.value === scalar(params.type)) ? scalar(params.type) : '',
    language: resourceLanguages.some((l) => l.value === scalar(params.language))
      ? scalar(params.language)
      : '',
    year: /^(19|20)\d{2}$|^2100$/.test(year) ? year : '',
    sort: ['year', 'title'].includes(scalar(params.sort)) ? scalar(params.sort) : 'updated',
    page: /^\d+$/.test(page) ? Math.max(1, Math.min(10000, Number(page))) : 1,
  }
}

export function libraryURL(filters: Partial<LibraryFilters> = {}) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value && !(key === 'page' && value === 1)) params.set(key, String(value))
  }
  return `/library${params.size ? `?${params}` : ''}`
}

export async function queryLibrary(payload: Payload, filters: LibraryFilters, limit = 12) {
  const and: Where[] = [{ _status: { equals: 'published' } }]
  if (filters.type) and.push({ resourceType: { equals: filters.type } })
  if (filters.language) and.push({ language: { equals: filters.language } })
  if (filters.year) and.push({ year: { equals: Number(filters.year) } })
  if (filters.category) and.push({ 'categories.slug': { equals: filters.category } })
  if (filters.q) {
    and.push({
      or: [
        ...['title', 'description', 'authors', 'keywords', 'doi', 'categories.title'].map(
          (field) => ({ [field]: { like: filters.q } }),
        ),
      ],
    })
  }
  return payload.find({
    collection: 'library-resources',
    overrideAccess: false,
    draft: false,
    depth: 1,
    limit: Math.max(1, Math.min(12, limit)),
    page: filters.page,
    sort:
      filters.sort === 'year'
        ? ['-year', 'id']
        : filters.sort === 'title'
          ? ['title', 'id']
          : ['-updatedAt', 'id'],
    where: { and },
    select: {
      title: true,
      slug: true,
      description: true,
      resourceType: true,
      authors: true,
      year: true,
      language: true,
      categories: true,
      updatedAt: true,
    },
  })
}

// This projection is always a guest query, including for signed-in administrators.
export async function findPublicResource(payload: Payload, slug: string) {
  let decodedSlug: string
  try {
    decodedSlug = decodeURIComponent(slug)
  } catch {
    return null
  }
  const result = await payload.find({
    collection: 'library-resources',
    overrideAccess: false,
    draft: false,
    depth: 1,
    limit: 1,
    where: { and: [{ slug: { equals: decodedSlug } }, { _status: { equals: 'published' } }] },
  })
  return result.docs[0] ?? null
}
