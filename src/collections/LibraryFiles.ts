import { APIError, type CollectionConfig } from 'payload'
import { authenticated } from '@/access/authenticated'
import { libraryFilesDir, MAX_PDF_BYTES } from '@/Library/files'

export const LibraryFiles: CollectionConfig = {
  slug: 'library-files',
  labels: { singular: 'ბიბლიოთეკის PDF', plural: 'ბიბლიოთეკის PDF ფაილები' },
  admin: { useAsTitle: 'title', group: 'კლინიკური ბიბლიოთეკა' },
  access: {
    create: authenticated,
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  upload: {
    staticDir: libraryFilesDir,
    mimeTypes: ['application/pdf'],
    pasteURL: false,
    crop: false,
    focalPoint: false,
    displayPreview: false,
  },
  fields: [
    { name: 'title', label: 'ფაილის სათაური', type: 'text', required: true },
    {
      name: 'rightsConfirmed',
      label: 'ამ PDF-ის საჯაროდ განთავსების უფლება გვაქვს',
      type: 'checkbox',
      required: true,
      admin: {
        description:
          'უფლების გაუქმებისას მოხსენით მონიშვნა: საჯარო ჩამოტვირთვა დაუყოვნებლივ შეწყდება.',
      },
    },
    {
      name: 'rightsNote',
      label: 'ლიცენზია ან ნებართვის საფუძველი',
      type: 'textarea',
      required: true,
      admin: {
        description:
          'მიუთითეთ ღია ლიცენზია ან უფლებამოსილი პირის ნებართვა. ეს ჩანაწერი საჯარო არ არის.',
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, originalDoc, operation, req }) => {
        if (
          (operation === 'create' || req.file) &&
          (data.rightsConfirmed ?? originalDoc?.rightsConfirmed) !== true
        ) {
          throw new APIError('ატვირთვას სჭირდება განთავსების უფლების დადასტურება.', 400)
        }
        return data
      },
    ],
    beforeOperation: [
      ({ args, operation, req }) => {
        if (
          (operation === 'create' || operation === 'update' || operation === 'updateByID') &&
          req.file
        ) {
          const file = req.file
          if (file.size > MAX_PDF_BYTES || file.data.length > MAX_PDF_BYTES) {
            throw new APIError('PDF ფაილის მაქსიმალური ზომაა 20 MB.', 400)
          }
          if (
            file.mimetype !== 'application/pdf' ||
            !/\.pdf$/i.test(file.name) ||
            file.data.subarray(0, 5).toString() !== '%PDF-'
          ) {
            throw new APIError('დაშვებულია მხოლოდ ნამდვილი PDF ფაილი (.pdf).', 400)
          }
        }
        return args
      },
    ],
  },
}
