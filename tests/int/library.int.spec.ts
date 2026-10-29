import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { queryLibrary, findPublicResource, parseLibraryFilters } from '@/Library/queries'
import { MAX_PDF_BYTES } from '@/Library/files'
import { cleanupLibraryFixture, fixturePDF, seedLibraryFixture } from '../helpers/libraryFixture'

let payload: Payload
let fixture: Awaited<ReturnType<typeof seedLibraryFixture>>
const filters = (params = {}) => parseLibraryFilters({ q: 'ბიბლიოთეკისძიება', ...params })

describe('Clinical library on PostgreSQL', () => {
  beforeAll(async () => {
    payload = await getPayload({ config })
    fixture = await seedLibraryFixture(payload)
  })
  afterAll(async () => {
    if (fixture) await cleanupLibraryFixture(payload, fixture)
    await payload.destroy()
  })

  it('creates and publishes as an existing administrator; guests cannot mutate', async () => {
    expect(await findPublicResource(payload, fixture.resources[0].slug)).toMatchObject({
      title: fixture.resources[0].title,
    })
    await expect(
      payload.create({
        collection: 'library-resources',
        overrideAccess: false,
        data: { ...fixture.base, title: 'Forbidden', slug: 'forbidden-fixture' },
      }),
    ).rejects.toMatchObject({ status: 403 })
    await expect(
      payload.update({
        collection: 'library-resources',
        id: fixture.resources[0].id,
        overrideAccess: false,
        data: { title: 'Forbidden', slug: 'forbidden-fixture' },
      }),
    ).rejects.toMatchObject({ status: 403 })
    await expect(
      payload.delete({
        collection: 'library-resources',
        id: fixture.resources[0].id,
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 })
  })
  it('generates a usable URL from a Georgian title without manual slug editing', async () => {
    const title = `ქართულიავტოსლაგისშემოწმება${Date.now()}`
    const resource = await payload.create({
      collection: 'library-resources',
      user: fixture.editor,
      overrideAccess: false,
      data: { ...fixture.base, title, slug: '', _status: 'published' },
    })
    try {
      expect(resource.slug).toBe(title)
      expect(await findPublicResource(payload, encodeURIComponent(resource.slug))).toMatchObject({
        id: resource.id,
      })
      expect(await findPublicResource(payload, resource.slug)).toMatchObject({ id: resource.id })
    } finally {
      await payload.delete({ collection: 'library-resources', id: resource.id })
    }
  })
  it('hides drafts from guest queries, direct IDs, slug lookup and version history', async () => {
    expect(await findPublicResource(payload, fixture.draft.slug)).toBeNull()
    expect((await queryLibrary(payload, filters({ q: 'დაფარულიბიბლიოთეკა' }))).totalDocs).toBe(0)
    expect(
      (
        await payload.find({
          collection: 'library-resources',
          overrideAccess: false,
          draft: true,
          where: { id: { equals: fixture.draft.id } },
        })
      ).totalDocs,
    ).toBe(0)
    await expect(
      payload.findByID({
        collection: 'library-resources',
        id: fixture.draft.id,
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 404 })
    await expect(
      payload.findVersions({ collection: 'library-resources', overrideAccess: false }),
    ).rejects.toMatchObject({ status: 403 })
  })
  it('searches Georgian keywords, authors and related category titles', async () => {
    for (const q of ['ბიბლიოთეკისძიება', 'სატესტოგამომცემელი', fixture.category.title]) {
      expect((await queryLibrary(payload, filters({ q }))).totalDocs).toBe(13)
    }
    expect((await queryLibrary(payload, filters({ q: 'არარსებული123' }))).totalDocs).toBe(0)
  })
  it('combines category, type, year and language filters against real rows', async () => {
    const result = await queryLibrary(
      payload,
      filters({
        category: fixture.category.slug!,
        type: 'guideline',
        year: '2025',
        language: 'en',
      }),
    )
    expect(result.docs.map((r) => r.id)).toEqual([fixture.resources[0].id])
    expect((await queryLibrary(payload, filters({ category: 'unknown-category' }))).totalDocs).toBe(
      0,
    )
  })
  it('paginates deterministically with filters preserved', async () => {
    const first = await queryLibrary(payload, filters())
    const second = await queryLibrary(payload, filters({ page: '2' }))
    expect(first.docs).toHaveLength(12)
    expect(first.hasNextPage).toBe(true)
    expect(second.docs).toHaveLength(1)
    expect(first.docs.some((r) => r.id === second.docs[0].id)).toBe(false)
  })
  it('publishes, updates and unpublishes without exposing stale public results', async () => {
    await payload.update({
      collection: 'library-resources',
      id: fixture.draft.id,
      user: fixture.editor,
      overrideAccess: false,
      data: { _status: 'published' },
    })
    expect(await findPublicResource(payload, fixture.draft.slug)).not.toBeNull()
    await payload.update({
      collection: 'library-resources',
      id: fixture.draft.id,
      user: fixture.editor,
      overrideAccess: false,
      data: { title: 'განახლებული სატესტო სათაური', _status: 'published' },
    })
    expect(await findPublicResource(payload, fixture.draft.slug)).toMatchObject({
      title: 'განახლებული სატესტო სათაური',
    })
    await payload.update({
      collection: 'library-resources',
      id: fixture.draft.id,
      user: fixture.editor,
      overrideAccess: false,
      data: { _status: 'draft' },
    })
    expect(await findPublicResource(payload, fixture.draft.slug)).toBeNull()
  })
  it('does not expose a newer draft revision of an already published resource', async () => {
    const original = fixture.resources[1]
    await payload.update({
      collection: 'library-resources',
      id: original.id,
      draft: true,
      user: fixture.editor,
      overrideAccess: false,
      data: { title: 'დაფარულიახალირევიზია', _status: 'draft' },
    })
    expect((await findPublicResource(payload, original.slug))?.title).toBe(original.title)
    const publicAPI = await payload.find({
      collection: 'library-resources',
      overrideAccess: false,
      draft: true,
      where: { title: { equals: 'დაფარულიახალირევიზია' } },
    })
    expect(publicAPI.totalDocs).toBe(0)
    await payload.update({
      collection: 'library-resources',
      id: original.id,
      data: { title: original.title, _status: 'published' },
    })
  })
  it('rejects a publication without a source and rejects unsafe URLs and DOI formats', async () => {
    for (const data of [
      { sourceUrl: null },
      { sourceUrl: 'javascript:alert(1)' },
      { sourceUrl: null, doi: 'not-a-doi' },
    ]) {
      await expect(
        payload.create({
          collection: 'library-resources',
          data: {
            ...fixture.base,
            title: 'Invalid fixture',
            slug: 'invalid-fixture',
            _status: 'published',
            ...data,
          },
        }),
      ).rejects.toBeDefined()
    }
  })
  it('keeps file metadata private and rejects spoofed, oversized and unlicensed PDFs', async () => {
    await expect(
      payload.find({ collection: 'library-files', overrideAccess: false }),
    ).rejects.toMatchObject({ status: 403 })
    const fileData = { title: 'Invalid fixture', rightsConfirmed: true, rightsNote: 'Test only' }
    await expect(
      payload.create({
        collection: 'library-files',
        data: { ...fileData, rightsConfirmed: false },
        file: fixturePDF(),
      }),
    ).rejects.toBeDefined()
    await expect(
      payload.create({
        collection: 'library-files',
        data: fileData,
        file: { ...fixturePDF(), data: Buffer.from('<html>test</html>') },
      }),
    ).rejects.toBeDefined()
    await expect(
      payload.create({
        collection: 'library-files',
        data: fileData,
        file: { ...fixturePDF(), size: MAX_PDF_BYTES + 1 },
      }),
    ).rejects.toBeDefined()
    await expect(
      payload.create({
        collection: 'library-files',
        data: fileData,
        file: { ...fixturePDF(), name: 'test.html' },
      }),
    ).rejects.toBeDefined()
  })
})
