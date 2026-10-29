import { APIError, slugField, type CollectionConfig } from 'payload'
import { authenticated } from '@/access/authenticated'
import { authenticatedOrPublished } from '@/access/authenticatedOrPublished'
import {
  librarySlug,
  officialURL,
  resourceLanguages,
  resourceTypes,
  validDOI,
} from '@/Library/options'

export const LibraryResources: CollectionConfig = {
  slug: 'library-resources',
  labels: { singular: 'კლინიკური რესურსი', plural: 'კლინიკური რესურსები' },
  admin: {
    group: 'კლინიკური ბიბლიოთეკა',
    useAsTitle: 'title',
    defaultColumns: ['title', 'resourceType', 'year', '_status', 'updatedAt'],
    description: 'დაამატეთ მხოლოდ გადამოწმებული წყაროები. PDF ატვირთეთ მხოლოდ განთავსების უფლებით.',
  },
  access: {
    create: authenticated,
    read: authenticatedOrPublished,
    readVersions: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    { name: 'title', label: 'სათაური', type: 'text', required: true, maxLength: 300 },
    { name: 'description', label: 'აღწერა', type: 'textarea', required: true, maxLength: 5000 },
    {
      name: 'resourceType',
      label: 'რესურსის ტიპი',
      type: 'select',
      required: true,
      options: resourceTypes,
      index: true,
    },
    {
      name: 'authors',
      label: 'ავტორი ან გამომცემელი ორგანიზაცია',
      type: 'text',
      required: true,
      maxLength: 500,
    },
    {
      name: 'year',
      label: 'გამოცემის წელი',
      type: 'number',
      required: true,
      min: 1900,
      max: 2100,
      index: true,
      validate: (value: number | null | undefined) =>
        (Number.isInteger(value) && Number(value) >= 1900 && Number(value) <= 2100) ||
        'მიუთითეთ წელი (1900–2100).',
    },
    { name: 'version', label: 'ვერსია', type: 'text', maxLength: 80 },
    {
      name: 'resourceUpdatedAt',
      label: 'წყაროს განახლების თარიღი',
      type: 'date',
      admin: { date: { pickerAppearance: 'dayOnly' } },
    },
    {
      name: 'language',
      label: 'ენა',
      type: 'select',
      required: true,
      defaultValue: 'en',
      options: resourceLanguages,
      index: true,
    },
    {
      name: 'categories',
      label: 'კლინიკური თემები',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      required: true,
    },
    {
      name: 'keywords',
      label: 'საკვანძო სიტყვები',
      type: 'text',
      maxLength: 500,
      admin: { description: 'გამოყავით მძიმეებით. ძიება ამ ველსაც მოიცავს.' },
    },
    {
      name: 'doi',
      label: 'DOI',
      type: 'text',
      maxLength: 300,
      validate: (value: string | null | undefined) =>
        !value || validDOI(value) || 'მიუთითეთ DOI ფორმატით 10.xxxx/… (URL-ის გარეშე).',
    },
    {
      name: 'sourceUrl',
      label: 'ოფიციალური წყარო (HTTPS)',
      type: 'text',
      maxLength: 2000,
      validate: (value: string | null | undefined) =>
        !value || Boolean(officialURL(value)) || 'მიუთითეთ ვალიდური HTTPS ბმული.',
    },
    {
      name: 'pdf',
      label: 'ნებადართული PDF',
      type: 'upload',
      relationTo: 'library-files',
      maxDepth: 0,
      admin: { description: 'ფაილი საჯაროდ ხელმისაწვდომია მხოლოდ გამოქვეყნებული რესურსიდან.' },
    },
    {
      name: 'meta',
      label: 'SEO',
      type: 'group',
      fields: [
        { name: 'title', label: 'SEO სათაური', type: 'text', maxLength: 160 },
        { name: 'description', label: 'SEO აღწერა', type: 'textarea', maxLength: 300 },
      ],
    },
    slugField({
      // Payload's default ASCII-only slugifier strips Georgian titles.
      slugify: ({ valueToSlugify }) => librarySlug(valueToSlugify),
    }),
  ],
  hooks: {
    beforeValidate: [
      ({ data, originalDoc, operation }) => {
        // Generate before required-field validation for REST/Local API callers too.
        if (data && !data.slug && (operation === 'create' || !originalDoc?.slug)) {
          data.slug = librarySlug(data.title ?? originalDoc?.title)
        }
        return data
      },
    ],
    beforeChange: [
      async ({ data, originalDoc, req }) => {
        const resource = { ...originalDoc, ...data }
        if (resource._status === 'published') {
          if (!resource.pdf && !officialURL(resource.sourceUrl) && !validDOI(resource.doi)) {
            throw new APIError(
              'გამოქვეყნებისთვის დაამატეთ ოფიციალური წყარო, DOI ან ნებადართული PDF.',
              400,
            )
          }
          if (resource.pdf) {
            const file = await req.payload.findByID({
              collection: 'library-files',
              id: typeof resource.pdf === 'object' ? resource.pdf.id : resource.pdf,
              req,
              depth: 0,
            })
            if (!file.rightsConfirmed)
              throw new APIError('PDF-ის განთავსების უფლება არ არის დადასტურებული.', 400)
          }
        }
        return data
      },
    ],
  },
  versions: { drafts: true, maxPerDoc: 30 },
}
