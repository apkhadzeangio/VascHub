import { APIError, slugField, type CollectionConfig, type Where } from 'payload'
import { authenticated } from '@/access/authenticated'
import {
  librarySlug,
  officialURL,
  resourceLanguages,
  validDOI,
  approvedLicenses,
} from '@/Library/options'

export const LibraryResources: CollectionConfig = {
  slug: 'library-resources',
  labels: { singular: 'კლინიკური რესურსი', plural: 'კლინიკური რესურსები' },
  admin: {
    group: 'კლინიკური ბიბლიოთეკა',
    useAsTitle: 'title',
    defaultColumns: ['title', 'documentType', 'publicationYear', '_status', 'updatedAt'],
    description:
      'გამოაქვეყნეთ მხოლოდ გადამოწმებული წყაროები. ხელმისაწვდომი PDF ავტომატურად არ ნიშნავს გავრცელების უფლებას.',
  },
  access: {
    create: authenticated,
    read: ({ req: { user } }) =>
      user
        ? true
        : ({
            and: [{ _status: { equals: 'published' } }, { visibility: { equals: 'public' } }],
          } as Where),
    readVersions: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    {
      name: 'title',
      label: 'ქართული სათაური',
      type: 'text',
      required: true,
      maxLength: 400,
      index: true,
    },
    {
      name: 'originalTitle',
      label: 'ორიგინალური სათაური',
      type: 'text',
      maxLength: 600,
      index: true,
    },
    { name: 'summary', label: 'მოკლე აღწერა', type: 'textarea', required: true, maxLength: 1500 },
    { name: 'description', label: 'გაფართოებული აღწერა', type: 'textarea', maxLength: 10000 },
    {
      name: 'documentType',
      label: 'დოკუმენტის ტიპი',
      type: 'relationship',
      relationTo: 'library-document-types',
      required: true,
      index: true,
    },
    {
      name: 'clinicalTopics',
      label: 'კლინიკური მიმართულებები',
      type: 'relationship',
      relationTo: 'library-topics',
      hasMany: true,
      required: true,
    },
    {
      name: 'publisherOrganization',
      label: 'გამომცემელი ორგანიზაცია',
      type: 'relationship',
      relationTo: 'library-organizations',
      required: true,
      index: true,
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
      name: 'publicationYear',
      label: 'გამოცემის წელი',
      type: 'number',
      required: true,
      min: 1900,
      max: 2100,
      index: true,
      validate: (v: number | null | undefined) =>
        (Number.isInteger(v) && Number(v) >= 1900 && Number(v) <= 2100) ||
        'მიუთითეთ მთელი წელი (1900–2100).',
    },
    {
      name: 'publicationDate',
      label: 'გამოქვეყნების ზუსტი თარიღი (თუ დადასტურებულია)',
      type: 'date',
    },
    {
      name: 'officialSourceUrl',
      label: 'ოფიციალური წყარო (HTTPS)',
      type: 'text',
      maxLength: 2000,
      validate: (v: string | null | undefined) =>
        !v || Boolean(officialURL(v)) || 'მიუთითეთ ვალიდური HTTPS ბმული.',
    },
    {
      name: 'doi',
      label: 'DOI',
      type: 'text',
      maxLength: 300,
      validate: (v: string | null | undefined) =>
        !v || validDOI(v) || 'DOI ფორმატი: 10.xxxx/… (URL-ის გარეშე).',
    },
    {
      name: 'pmid',
      label: 'PMID',
      type: 'text',
      maxLength: 10,
      validate: (v: string | null | undefined) =>
        !v || /^[1-9]\d{0,9}$/.test(v) || 'PMID უნდა იყოს დადებითი რიცხვი.',
    },
    { name: 'authors', label: 'ავტორები', type: 'text', maxLength: 2000 },
    { name: 'journal', label: 'ჟურნალი', type: 'text', maxLength: 300 },
    { name: 'citationText', label: 'ბიბლიოგრაფიული ციტირება', type: 'textarea', maxLength: 3000 },
    { name: 'versionLabel', label: 'გამოცემა / ვერსია', type: 'text', maxLength: 150 },
    {
      name: 'editionStatus',
      label: 'გამოცემის სტატუსი',
      type: 'select',
      defaultValue: 'not-assessed',
      required: true,
      options: [
        { value: 'not-assessed', label: 'მოგვიანებითი განახლება არ არის შეფასებული' },
        { value: 'original', label: 'ორიგინალური გამოცემა' },
        { value: 'updated', label: 'განახლებული გამოცემა' },
        { value: 'superseded', label: 'არსებობს დადასტურებული ახალი გამოცემა' },
      ],
    },
    {
      name: 'supersededBy',
      label: 'ახალი გამოცემა',
      type: 'relationship',
      relationTo: 'library-resources',
      maxDepth: 0,
    },
    {
      name: 'updateEvidenceUrl',
      label: 'განახლების დადასტურების ბმული',
      type: 'text',
      validate: (v: string | null | undefined) =>
        !v || Boolean(officialURL(v)) || 'მიუთითეთ HTTPS ბმული.',
    },
    { name: 'lastReviewedAt', label: 'მეტამონაცემების გადამოწმების თარიღი', type: 'date' },
    {
      name: 'attachment',
      label: 'ნებადართული PDF',
      type: 'upload',
      relationTo: 'library-files',
      maxDepth: 0,
    },
    {
      name: 'attachmentType',
      label: 'დანართის ტიპი',
      type: 'select',
      defaultValue: 'none',
      options: [
        { value: 'none', label: 'დანართის გარეშე' },
        { value: 'pdf', label: 'PDF' },
      ],
    },
    {
      name: 'accessType',
      label: 'ხელმისაწვდომობა',
      type: 'select',
      defaultValue: 'external',
      required: true,
      options: [
        { value: 'external', label: 'ოფიციალური გარე წყარო' },
        { value: 'hosted', label: 'უფლებამოსილად შენახული PDF' },
      ],
    },
    {
      name: 'licenseStatus',
      label: 'გავრცელების უფლება',
      type: 'select',
      defaultValue: 'external-only',
      required: true,
      options: [
        { value: 'external-only', label: 'მხოლოდ ბმული — გავრცელების უფლება არ არის შეფასებული' },
        { value: 'unverified', label: 'გავრცელების უფლება არ არის დადასტურებული' },
        { value: 'open-license', label: 'შესაბამისი ღია ლიცენზია' },
        { value: 'permission-granted', label: 'უფლებამოსილი პირის ნებართვა' },
        { value: 'owned', label: 'საკუთარი დოკუმენტი' },
      ],
    },
    {
      name: 'rightsEvidence',
      label: 'ლიცენზიის / ნებართვის მტკიცებულება (ადმინისტრაციული)',
      type: 'textarea',
      maxLength: 3000,
      access: { read: ({ req }) => Boolean(req.user) },
    },
    {
      name: 'copyrightNotice',
      label: 'საავტორო უფლებების შენიშვნა',
      type: 'textarea',
      maxLength: 2000,
    },
    {
      name: 'visibility',
      label: 'საჯარო წვდომა',
      type: 'select',
      required: true,
      defaultValue: 'public',
      index: true,
      options: [
        { value: 'public', label: 'საჯარო' },
        { value: 'internal', label: 'მხოლოდ ადმინისტრაცია' },
      ],
    },
    { name: 'featured', label: 'გამორჩეული', type: 'checkbox', defaultValue: false, index: true },
    {
      name: 'searchKeywords',
      label: 'საკვანძო სიტყვები და აბრევიატურები',
      type: 'text',
      maxLength: 1000,
    },
    {
      name: 'relatedResources',
      label: 'დაკავშირებული რესურსები',
      type: 'relationship',
      relationTo: 'library-resources',
      hasMany: true,
      maxDepth: 0,
    },
    {
      name: 'importKey',
      type: 'text',
      unique: true,
      index: true,
      admin: { readOnly: true, description: 'იმპორტის სტაბილური იდენტიფიკატორი; არ შეცვალოთ.' },
    },
    {
      name: 'meta',
      label: 'SEO',
      type: 'group',
      fields: [
        { name: 'title', type: 'text', maxLength: 160 },
        { name: 'description', type: 'textarea', maxLength: 300 },
      ],
    },
    slugField({ slugify: ({ valueToSlugify }) => librarySlug(valueToSlugify) }),
  ],
  hooks: {
    beforeValidate: [
      ({ data, originalDoc, operation }) => {
        if (data && !data.slug && (operation === 'create' || !originalDoc?.slug))
          data.slug = librarySlug(data.title ?? originalDoc?.title)
        if (data)
          for (const name of ['title', 'originalTitle', 'summary', 'searchKeywords', 'authors'])
            if (typeof data[name] === 'string') data[name] = data[name].normalize('NFC')
        return data
      },
    ],
    beforeChange: [
      async ({ data, originalDoc, req }) => {
        const r = { ...originalDoc, ...data }
        if (r._status === 'published') {
          if (!officialURL(r.officialSourceUrl) || !r.lastReviewedAt)
            throw new APIError(
              'გამოქვეყნებისთვის საჭიროა გადამოწმებული ოფიციალური წყარო და გადამოწმების თარიღი.',
              400,
            )
          if (
            ['updated', 'superseded'].includes(r.editionStatus) &&
            !officialURL(r.updateEvidenceUrl)
          )
            throw new APIError('გამოცემის განახლების სტატუსს სჭირდება დამადასტურებელი ბმული.', 400)
          if (r.attachment) {
            if (
              r.accessType !== 'hosted' ||
              r.attachmentType !== 'pdf' ||
              !approvedLicenses.includes(r.licenseStatus) ||
              !r.rightsEvidence?.trim()
            )
              throw new APIError(
                'PDF-ის გამოქვეყნებას სჭირდება ლიცენზია და უფლებების მტკიცებულება.',
                400,
              )
            const file = await req.payload.findByID({
              collection: 'library-files',
              id: typeof r.attachment === 'object' ? r.attachment.id : r.attachment,
              req,
              depth: 0,
            })
            if (!file.rightsConfirmed)
              throw new APIError('PDF-ის განთავსების უფლება არ არის დადასტურებული.', 400)
          } else if (r.accessType === 'hosted')
            throw new APIError('შენახული დოკუმენტისთვის საჭიროა PDF დანართი.', 400)
        }
        return data
      },
    ],
  },
  versions: { drafts: true, maxPerDoc: 30 },
}
