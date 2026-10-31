import type { CollectionConfig } from 'payload'
import {
  contactFields,
  directoryAccess,
  identityFields,
  normalizeDirectory,
  publicCentreRelationships,
} from './shared'
import { publicWebsite } from '@/Directory/values'
import { guardGuestCentreQueries } from './guestQueries'
export const Specialists: CollectionConfig = {
  slug: 'specialists',
  labels: { singular: 'სპეციალისტი', plural: 'სპეციალისტები' },
  admin: {
    group: 'პროფესიული ქსელი',
    useAsTitle: 'name',
    defaultColumns: ['name', 'city', '_status', 'updatedAt'],
    description:
      'შეავსეთ მხოლოდ დადასტურებული საჯარო პროფესიული ინფორმაცია. ეს პროფილი Users-ის ანგარიშს არ ქმნის.',
  },
  access: directoryAccess,
  fields: [
    ...identityFields,
    {
      name: 'specializations',
      label: 'სპეციალიზაცია / პროფესიული მიმართულებები',
      type: 'text',
      hasMany: true,
      required: true,
      minRows: 1,
      maxRows: 20,
      maxLength: 160,
      index: true,
    },
    {
      name: 'centres',
      label: 'დაკავშირებული ცენტრები',
      type: 'relationship',
      relationTo: 'centres',
      hasMany: true,
      maxDepth: 0,
      hooks: { afterRead: [publicCentreRelationships] },
    },
    { name: 'photo', label: 'ფოტო (არჩევითი)', type: 'upload', relationTo: 'media', maxDepth: 0 },
    ...contactFields,
    {
      name: 'professionalLinks',
      label: 'საჯარო პროფესიული ბმულები',
      type: 'array',
      maxRows: 8,
      fields: [
        { name: 'label', label: 'დასახელება', type: 'text', required: true, maxLength: 120 },
        {
          name: 'url',
          label: 'HTTPS ბმული',
          type: 'text',
          required: true,
          maxLength: 2000,
          validate: (v: string | null | undefined) =>
            !v || !!publicWebsite(v) || 'მიუთითეთ ვალიდური HTTPS ბმული.',
        },
      ],
    },
  ],
  hooks: { beforeValidate: [normalizeDirectory], beforeOperation: [guardGuestCentreQueries] },
  versions: { drafts: true, maxPerDoc: 30 },
}
