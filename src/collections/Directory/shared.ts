import type { CollectionBeforeValidateHook, Field, FieldHook } from 'payload'
import { authenticated } from '@/access/authenticated'
import { authenticatedOrPublished } from '@/access/authenticatedOrPublished'
import { publicWebsite } from '@/Directory/values'
export const directoryAccess = {
  create: authenticated,
  read: authenticatedOrPublished,
  readVersions: authenticated,
  update: authenticated,
  delete: authenticated,
}
export function directorySlug(v: unknown) {
  return typeof v === 'string'
    ? v
        .normalize('NFC')
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 180)
        .replace(/-+$/g, '')
    : ''
}
export const normalizeDirectory: CollectionBeforeValidateHook = ({ data, originalDoc }) => {
  if (!data) return data
  for (const f of ['name', 'city', 'summary', 'address', 'phone'])
    if (typeof data[f] === 'string') data[f] = data[f].normalize('NFC').trim()
  for (const f of ['specializations', 'directions'])
    if (Array.isArray(data[f]))
      data[f] = [
        ...new Set(
          data[f]
            .map((v: unknown) => (typeof v === 'string' ? v.normalize('NFC').trim() : v))
            .filter(Boolean),
        ),
      ]
  data.slug = data.slug
    ? directorySlug(data.slug)
    : originalDoc?.slug || directorySlug(data.name ?? originalDoc?.name)
  return data
}
export const identityFields: Field[] = [
  {
    name: 'name',
    label: 'სახელი და გვარი / დასახელება',
    type: 'text',
    required: true,
    maxLength: 300,
    index: true,
  },
  {
    name: 'slug',
    label: 'უნიკალური Slug',
    type: 'text',
    required: true,
    unique: true,
    index: true,
    maxLength: 180,
    admin: {
      description:
        'ცარიელი Slug შექმნისას ავტომატურად შეივსება. გამოქვეყნების შემდეგ შეცვლა შეცვლის პროფილის ბმულს.',
    },
    validate: (v: string | null | undefined) =>
      !v ||
      /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u.test(v) ||
      'გამოიყენეთ ასოები, ციფრები და დეფისი.',
  },
  { name: 'city', label: 'ქალაქი', type: 'text', required: true, maxLength: 120, index: true },
  {
    name: 'summary',
    label: 'მოკლე პროფესიული აღწერა',
    type: 'textarea',
    required: true,
    maxLength: 2000,
  },
]
export const contactFields: Field[] = [
  {
    name: 'website',
    label: 'ოფიციალური / პროფესიული ვებგვერდი',
    type: 'text',
    maxLength: 2000,
    validate: (v: string | null | undefined) =>
      !v || !!publicWebsite(v) || 'მიუთითეთ ვალიდური HTTPS ბმული.',
  },
  { name: 'email', label: 'საჯარო პროფესიული ელფოსტა', type: 'email' },
  { name: 'phone', label: 'საჯარო პროფესიული ტელეფონი', type: 'text', maxLength: 80 },
]
// Sanitize anonymous native API relationships too; administrators retain native editing access.
export const publicCentreRelationships: FieldHook = async ({ value, req }) => {
  if (req.user || !Array.isArray(value) || !value.length) return value
  const ids = value.map((v) => (typeof v === 'object' && v ? v.id : v)).filter(Boolean)
  const r = await req.payload.find({
    collection: 'centres',
    overrideAccess: false,
    user: null,
    req,
    draft: false,
    depth: 0,
    pagination: false,
    where: { and: [{ id: { in: ids } }, { _status: { equals: 'published' } }] },
    select: { name: true },
  })
  const available = new Set(r.docs.map((c) => c.id))
  return value.filter((v) => available.has(typeof v === 'object' && v ? v.id : v))
}
