import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { homeStatic } from '@/endpoints/seed/home-static'

let payload: Payload
let pageID: number | undefined

describe('PostgreSQL API and access control', () => {
  beforeAll(async () => {
    payload = await getPayload({ config })
  })
  afterAll(async () => {
    if (pageID !== undefined)
      await payload.delete({
        collection: 'pages',
        id: pageID,
        context: { disableRevalidate: true },
      })
    await payload.destroy()
  })

  it('should deny anonymous administrator creation', async () => {
    await expect(
      payload.create({
        collection: 'users',
        overrideAccess: false,
        data: { email: 'anonymous@vaschub.test', password: 'not-a-real-password-123' },
      }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('should deny bypassing registration through the local first-user path', async () => {
    await expect(
      payload.create({
        collection: 'users',
        overrideAccess: true,
        data: { email: 'anonymous@vaschub.test', password: 'not-a-real-password-123' },
      }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('should hide drafts and expose published CMS pages', async () => {
    const page = await payload.create({
      collection: 'pages',
      data: {
        ...homeStatic,
        slug: 'integration-check',
        title: 'Integration check',
        _status: 'draft',
        layout: [
          { blockType: 'content', columns: [{ size: 'full' }] },
        ],
      },
      context: { disableRevalidate: true },
    })
    pageID = page.id
    const draft = await payload.find({
      collection: 'pages',
      overrideAccess: false,
      where: { id: { equals: page.id } },
    })
    expect(draft.totalDocs).toBe(0)
    await payload.update({
      collection: 'pages',
      id: page.id,
      data: { _status: 'published' },
      context: { disableRevalidate: true },
    })
    const published = await payload.find({
      collection: 'pages',
      overrideAccess: false,
      where: { id: { equals: page.id } },
    })
    expect(published.totalDocs).toBe(1)
  })
})
