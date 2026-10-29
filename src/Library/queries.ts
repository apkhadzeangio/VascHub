import type { Payload, Where } from 'payload'
import { resourceLanguages } from './options'

export type LibraryFilters = {
  q: string
  topic: string
  type: string
  organization: string
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
    q: scalar(params.q).normalize('NFC').toLowerCase().trim().slice(0, 160),
    topic: scalar(params.topic).slice(0, 160),
    type: scalar(params.type).slice(0, 160),
    organization: scalar(params.organization).slice(0, 160),
    language: resourceLanguages.some((l) => l.value === scalar(params.language))
      ? scalar(params.language)
      : '',
    year: /^(19|20)\d{2}$|^2100$/.test(year) ? year : '',
    sort: ['year', 'title'].includes(scalar(params.sort)) ? scalar(params.sort) : 'added',
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
  const and: Where[] = [{ _status: { equals: 'published' } }, { visibility: { equals: 'public' } }]
  if (filters.type) and.push({ 'documentType.slug': { equals: filters.type } })
  if (filters.organization)
    and.push({ 'publisherOrganization.slug': { equals: filters.organization } })
  if (filters.language) and.push({ language: { equals: filters.language } })
  if (filters.year) and.push({ publicationYear: { equals: Number(filters.year) } })
  if (filters.topic) and.push({ 'clinicalTopics.slug': { equals: filters.topic } })
  if (filters.q) {
    and.push({
      or: [
        ...[
          'title',
          'originalTitle',
          'summary',
          'authors',
          'searchKeywords',
          'doi',
          'clinicalTopics.title',
          'publisherOrganization.title',
          'publisherOrganization.abbreviation',
        ].map((field) => ({ [field]: { like: filters.q } })),
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
        ? ['-publicationYear', 'id']
        : filters.sort === 'title'
          ? ['title', 'id']
          : ['-createdAt', 'id'],
    where: { and },
    select: {
      title: true,
      slug: true,
      summary: true,
      documentType: true,
      publisherOrganization: true,
      publicationYear: true,
      language: true,
      clinicalTopics: true,
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
