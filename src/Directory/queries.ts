import type { Payload, Where } from 'payload'
import type { Centre, Specialist } from '@/payload-types'
import { decodeSlug, type DirectoryFilters, type DirectoryKind } from './values'
// Never inherit the request, cookies, user or preview state for public projections.
const guest = { overrideAccess: false, user: null, draft: false, depth: 0 } as const
const published: Where = { _status: { equals: 'published' } }
const centreSelect = {
  name: true,
  slug: true,
  city: true,
  summary: true,
  address: true,
  directions: true,
  website: true,
  email: true,
  phone: true,
  image: true,
} as const
const specialistSelect = {
  name: true,
  slug: true,
  city: true,
  summary: true,
  specializations: true,
  centres: true,
  photo: true,
  website: true,
  email: true,
  phone: true,
  professionalLinks: true,
} as const
type Photo = { url: string; alt: string }
export type PublicCentre = Pick<
  Centre,
  | 'id'
  | 'name'
  | 'slug'
  | 'city'
  | 'summary'
  | 'address'
  | 'directions'
  | 'website'
  | 'email'
  | 'phone'
> & { image: Photo | null }
export type PublicSpecialist = Pick<
  Specialist,
  | 'id'
  | 'name'
  | 'slug'
  | 'city'
  | 'summary'
  | 'specializations'
  | 'website'
  | 'email'
  | 'phone'
  | 'professionalLinks'
> & { photo: Photo | null; centres: Pick<Centre, 'id' | 'name' | 'slug' | 'city'>[] }
const relationID = (v: number | { id: number } | null | undefined) =>
  typeof v === 'object' && v ? v.id : v
async function mediaMap(payload: Payload, ids: (number | null | undefined)[]) {
  const unique = [...new Set(ids.filter((id): id is number => typeof id === 'number'))],
    photos = new Map<number, Photo>()
  if (!unique.length) return photos
  // Payload derives upload URLs in afterRead from filename, even with select.
  const r = await payload.find({
    collection: 'media',
    ...guest,
    pagination: false,
    where: { id: { in: unique } },
    select: { url: true, filename: true, alt: true, mimeType: true },
  })
  for (const m of r.docs) {
    if (!m.url || !m.mimeType?.startsWith('image/')) continue
    try {
      const u = new URL(m.url, 'http://directory.local')
      if (u.pathname.startsWith('/api/media/file/'))
        photos.set(m.id, { url: u.pathname, alt: m.alt || '' })
    } catch {
      /* Invalid media uses a neutral placeholder. */
    }
  }
  return photos
}
async function hydrateCentres(
  payload: Payload,
  docs: Omit<Centre, 'createdAt' | 'updatedAt'>[],
): Promise<PublicCentre[]> {
  const images = await mediaMap(
    payload,
    docs.map((c) => relationID(c.image)),
  )
  return docs.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    city: c.city,
    summary: c.summary,
    address: c.address,
    directions: c.directions,
    website: c.website,
    email: c.email,
    phone: c.phone,
    image: images.get(relationID(c.image) ?? -1) ?? null,
  }))
}
async function hydrateSpecialists(
  payload: Payload,
  docs: Omit<Specialist, 'createdAt' | 'updatedAt'>[],
): Promise<PublicSpecialist[]> {
  const ids = [...new Set(docs.flatMap((s) => (s.centres || []).map((c) => relationID(c)!)))]
  const [related, images] = await Promise.all([
    ids.length
      ? payload.find({
          collection: 'centres',
          ...guest,
          pagination: false,
          where: { and: [published, { id: { in: ids } }] },
          select: { name: true, slug: true, city: true },
        })
      : null,
    mediaMap(
      payload,
      docs.map((s) => relationID(s.photo)),
    ),
  ])
  const centres = new Map(related?.docs.map((c) => [c.id, c]) ?? [])
  return docs.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    city: s.city,
    summary: s.summary,
    specializations: s.specializations,
    website: s.website,
    email: s.email,
    phone: s.phone,
    professionalLinks: s.professionalLinks,
    photo: images.get(relationID(s.photo) ?? -1) ?? null,
    centres: (s.centres || []).flatMap((c) => {
      const r = centres.get(relationID(c)!)
      return r ? [r] : []
    }),
  }))
}
export async function querySpecialists(payload: Payload, f: DirectoryFilters) {
  const and: Where[] = [published]
  if (f.q) and.push({ name: { like: f.q } })
  if (f.city) and.push({ city: { equals: f.city } })
  if (f.specialization) and.push({ specializations: { equals: f.specialization } })
  if (f.centre) {
    const c = await findPublicCentre(payload, f.centre)
    and.push({ centres: { equals: c?.id ?? -1 } })
  }
  const r = await payload.find({
    collection: 'specialists',
    ...guest,
    where: { and },
    limit: 12,
    page: f.page,
    sort: ['name', 'id'],
    select: specialistSelect,
  })
  return { ...r, docs: await hydrateSpecialists(payload, r.docs) }
}
export async function queryCentres(payload: Payload, f: DirectoryFilters) {
  const and: Where[] = [published]
  if (f.q) and.push({ name: { like: f.q } })
  if (f.city) and.push({ city: { equals: f.city } })
  const r = await payload.find({
    collection: 'centres',
    ...guest,
    where: { and },
    limit: 12,
    page: f.page,
    sort: ['name', 'id'],
    select: centreSelect,
  })
  return { ...r, docs: await hydrateCentres(payload, r.docs) }
}
export async function findPublicSpecialist(payload: Payload, value: string) {
  const slug = decodeSlug(value)
  if (!slug) return null
  const r = await payload.find({
    collection: 'specialists',
    ...guest,
    limit: 1,
    where: { and: [published, { slug: { equals: slug } }] },
    select: specialistSelect,
  })
  return (await hydrateSpecialists(payload, r.docs))[0] ?? null
}
export async function findPublicCentre(payload: Payload, value: string) {
  const slug = decodeSlug(value)
  if (!slug) return null
  const r = await payload.find({
    collection: 'centres',
    ...guest,
    limit: 1,
    where: { and: [published, { slug: { equals: slug } }] },
    select: centreSelect,
  })
  return (await hydrateCentres(payload, r.docs))[0] ?? null
}
export async function directoryFacets(payload: Payload, kind: DirectoryKind) {
  const [cities, specializations, centres] = await Promise.all([
    payload.findDistinct({
      collection: kind,
      field: 'city',
      overrideAccess: false,
      user: null,
      depth: 0,
      where: published,
    }),
    kind === 'specialists'
      ? payload.findDistinct({
          collection: 'specialists',
          field: 'specializations',
          overrideAccess: false,
          user: null,
          depth: 0,
          where: published,
        })
      : null,
    kind === 'specialists'
      ? payload.find({
          collection: 'centres',
          ...guest,
          pagination: false,
          where: published,
          sort: ['name', 'id'],
          select: { name: true, slug: true },
        })
      : null,
  ])
  const sorted = (v: unknown[]) =>
    [...new Set(v.flat().filter((v): v is string => typeof v === 'string' && !!v))].sort((a, b) =>
      a.localeCompare(b, 'ka'),
    )
  return {
    cities: sorted(cities.values.map((d) => d.city)),
    specializations: sorted(specializations?.values.map((d) => d.specializations) ?? []),
    centres: centres?.docs ?? [],
  }
}
