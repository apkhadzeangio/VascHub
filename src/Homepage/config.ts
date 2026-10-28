import type { GroupField } from 'payload'
import { homepageDefaults, publicHref } from './defaults'

export const homepageFields: GroupField = {
  name: 'homepage',
  type: 'group',
  label: 'მთავარი გვერდი',
  admin: {
    condition: (data) => data?.slug === 'home',
    description: 'მთავარი გვერდი იყენებს home slug-ს. ცვლილებების გამოსაჩენად გამოაქვეყნეთ გვერდი.',
  },
  fields: [
    {
      name: 'eyebrow',
      label: 'მოკლე წარწერა',
      type: 'text',
      defaultValue: homepageDefaults.eyebrow,
    },
    {
      name: 'heading',
      label: 'მთავარი სათაური',
      type: 'text',
      defaultValue: homepageDefaults.heading,
      maxLength: 160,
    },
    {
      name: 'intro',
      label: 'წარდგენა',
      type: 'textarea',
      defaultValue: homepageDefaults.intro,
      maxLength: 400,
    },
    {
      name: 'topics',
      label: 'კლინიკური თემები',
      type: 'array',
      maxRows: 8,
      defaultValue: homepageDefaults.topics,
      fields: [
        { name: 'label', label: 'თემა', type: 'text', required: true, maxLength: 80 },
        {
          name: 'searchTerm',
          label: 'საძიებო სიტყვა',
          type: 'text',
          required: true,
          maxLength: 160,
        },
      ],
    },
    {
      name: 'resources',
      label: 'გამორჩეული რესურსები',
      type: 'relationship',
      relationTo: 'posts',
      hasMany: true,
      maxRows: 3,
      filterOptions: { _status: { equals: 'published' } },
      admin: {
        description: 'ცარიელი არჩევანისას გამოჩნდება სამი ბოლო განახლებული გამოქვეყნებული სტატია.',
      },
    },
    {
      name: 'academy',
      label: 'სასწავლო მასალა',
      type: 'group',
      fields: [
        {
          name: 'heading',
          label: 'სათაური',
          type: 'text',
          defaultValue: homepageDefaults.academy.heading,
          maxLength: 160,
        },
        {
          name: 'description',
          label: 'აღწერა',
          type: 'textarea',
          defaultValue: homepageDefaults.academy.description,
          maxLength: 300,
        },
        {
          name: 'post',
          label: 'გამოქვეყნებული სასწავლო სტატია',
          type: 'relationship',
          relationTo: 'posts',
          filterOptions: { _status: { equals: 'published' } },
        },
      ],
    },
    {
      name: 'events',
      label: 'ღონისძიებების მოკლე ცნობები',
      type: 'array',
      maxRows: 2,
      admin: {
        description:
          'დაამატეთ მხოლოდ დადასტურებული ინფორმაცია. ეს მთავარი გვერდის ცნობებია და არა რეგისტრაციის მოდული.',
      },
      fields: [
        { name: 'title', label: 'დასახელება', type: 'text', required: true, maxLength: 160 },
        { name: 'date', label: 'თარიღი', type: 'date' },
        { name: 'location', label: 'ადგილი', type: 'text', maxLength: 120 },
        {
          name: 'url',
          label: 'ინფორმაციის ბმული',
          type: 'text',
          required: true,
          validate: (value: string | null | undefined) =>
            Boolean(publicHref(value)) || 'მიუთითეთ საჯარო ლოკალური მისამართი ან http(s) ბმული.',
        },
      ],
    },
    {
      name: 'newsPosts',
      label: 'პროფესიული სიახლეები',
      type: 'relationship',
      relationTo: 'posts',
      hasMany: true,
      maxRows: 2,
      filterOptions: { _status: { equals: 'published' } },
      admin: { description: 'აირჩიეთ მაქსიმუმ ორი გამოქვეყნებული სტატია.' },
    },
  ],
}
