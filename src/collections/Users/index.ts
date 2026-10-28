import { APIError, type CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: authenticated,
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['name', 'email'],
    useAsTitle: 'name',
  },
  auth: true,
  endpoints: [
    {
      path: '/first-register',
      method: 'post',
      handler: () =>
        Response.json(
          { errors: [{ message: 'Use pnpm admin:create on the server.' }] },
          { status: 403 },
        ),
    },
  ],
  fields: [
    {
      name: 'name',
      type: 'text',
    },
  ],
  hooks: {
    beforeChange: [
      ({ operation, req, context, data }) => {
        if (operation === 'create' && !req.user && context.bootstrapAdmin !== true) {
          throw new APIError(
            'Administrator accounts can only be created on the server or by an administrator.',
            403,
          )
        }
        return data
      },
    ],
  },
  timestamps: true,
}
