import type { CollectionConfig } from 'payload'
import { contactFields, directoryAccess, identityFields, normalizeDirectory } from './shared'
export const Centres: CollectionConfig = {
  slug: 'centres',
  labels: { singular: 'სისხლძარღვთა ცენტრი', plural: 'სისხლძარღვთა ცენტრები' },
  admin: {
    group: 'პროფესიული ქსელი',
    useAsTitle: 'name',
    defaultColumns: ['name', 'city', '_status', 'updatedAt'],
    description:
      'მხოლოდ საჯარო პროფესიული ინფორმაცია. გამოქვეყნება ცენტრის აკრედიტაციას არ ადასტურებს.',
  },
  access: directoryAccess,
  fields: [
    ...identityFields,
    { name: 'address', label: 'საჯარო მისამართი', type: 'text', maxLength: 500 },
    {
      name: 'directions',
      label: 'ძირითადი მიმართულებები',
      type: 'text',
      hasMany: true,
      maxRows: 20,
      maxLength: 160,
    },
    ...contactFields,
    {
      name: 'image',
      label: 'ცენტრის გამოსახულება (არჩევითი)',
      type: 'upload',
      relationTo: 'media',
      maxDepth: 0,
    },
  ],
  hooks: { beforeValidate: [normalizeDirectory] },
  versions: { drafts: true, maxPerDoc: 30 },
}
