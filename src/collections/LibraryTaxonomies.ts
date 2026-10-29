import { APIError, slugField, type CollectionConfig, type Where } from 'payload'
import { authenticated } from '@/access/authenticated'
import { anyone } from '@/access/anyone'
import { librarySlug, officialURL } from '@/Library/options'

function taxonomy(
  slug: 'library-topics' | 'library-document-types' | 'library-organizations',
  singular: string,
  plural: string,
): CollectionConfig {
  return {
    slug,
    labels: { singular, plural },
    admin: { useAsTitle: 'title', group: 'კლინიკური ბიბლიოთეკა' },
    access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
    fields: [
      { name: 'title', label: 'დასახელება', type: 'text', required: true, maxLength: 300 },
      { name: 'abbreviation', label: 'აბრევიატურა', type: 'text', maxLength: 80, index: true },
      {
        name: 'officialUrl',
        label: 'ოფიციალური ბმული',
        type: 'text',
        validate: (v: string | null | undefined) =>
          !v || Boolean(officialURL(v)) || 'მიუთითეთ HTTPS ბმული.',
      },
      slugField({ slugify: ({ valueToSlugify }) => librarySlug(valueToSlugify) }),
    ],
    hooks: {
      beforeDelete: [
        async ({ id, req }) => {
          const field =
            slug === 'library-topics'
              ? 'clinicalTopics'
              : slug === 'library-document-types'
                ? 'documentType'
                : 'publisherOrganization'
          const where: Where = { [field]: { equals: id } }
          for (const draft of [false, true]) {
            const used = await req.payload.find({
              collection: 'library-resources',
              req,
              where,
              draft,
              depth: 0,
              limit: 1,
              overrideAccess: true,
            })
            if (used.docs.length)
              throw new APIError(
                'ეს კლასიფიკატორი გამოყენებულია რესურსში. ჯერ შეცვალეთ შესაბამისი კავშირები.',
                400,
              )
          }
        },
      ],
      beforeValidate: [
        ({ data, originalDoc }) => {
          if (data && !data.slug && !originalDoc?.slug) data.slug = librarySlug(data.title)
          return data
        },
      ],
    },
  }
}
export const LibraryTopics = taxonomy(
  'library-topics',
  'კლინიკური მიმართულება',
  'კლინიკური მიმართულებები',
)
export const LibraryDocumentTypes = taxonomy(
  'library-document-types',
  'დოკუმენტის ტიპი',
  'დოკუმენტის ტიპები',
)
export const LibraryOrganizations = taxonomy(
  'library-organizations',
  'გამომცემელი ორგანიზაცია',
  'გამომცემელი ორგანიზაციები',
)
