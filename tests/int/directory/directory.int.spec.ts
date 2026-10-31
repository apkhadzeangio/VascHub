import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import {
  directoryFacets,
  findPublicCentre,
  findPublicSpecialist,
  queryCentres,
  querySpecialists,
} from '@/Directory/queries'
import { directoryURL, parseDirectoryFilters } from '@/Directory/values'
import {
  assertDirectoryTestDatabase,
  cleanupDirectoryFixture,
  seedDirectoryFixture,
} from '../../helpers/directoryFixture'
let payload: Payload
let f: Awaited<ReturnType<typeof seedDirectoryFixture>>
const filters = (p = {}) => parseDirectoryFilters({ q: 'სინთეტიკურიცნობარი', ...p })
describe.skipIf(process.env.DIRECTORY_TESTS !== '1')(
  'Directory on native Payload/PostgreSQL',
  () => {
    beforeAll(async () => {
      assertDirectoryTestDatabase()
      payload = await getPayload({ config })
      f = await seedDirectoryFixture(payload)
    }, 60000)
    afterAll(async () => {
      try {
        if (f) await cleanupDirectoryFixture(payload, f)
      } finally {
        if (payload) await payload.destroy()
      }
    })
    it('administrator CRUD works for both collections', async () => {
      for (const collection of ['specialists', 'centres'] as const) {
        const d = await payload.create({
          collection,
          overrideAccess: false,
          user: f.editor,
          data: {
            ...f.base,
            name: 'სინთეტიკური CRUD',
            slug: `synthetic-crud-${collection}`,
            _status: 'published',
          },
        })
        expect(
          (
            await payload.update({
              collection,
              id: d.id,
              overrideAccess: false,
              user: f.editor,
              data: { name: 'სინთეტიკური CRUD განახლდა' },
            })
          ).name,
        ).toContain('განახლდა')
        await payload.delete({ collection, id: d.id, overrideAccess: false, user: f.editor })
        expect(
          (
            await payload.find({
              collection,
              overrideAccess: false,
              where: { id: { equals: d.id } },
            })
          ).totalDocs,
        ).toBe(0)
      }
    })
    it('anonymous CRUD and version history are forbidden', async () => {
      for (const [collection, id] of [
        ['specialists', f.specialists[0].id],
        ['centres', f.centres[0].id],
      ] as const) {
        await expect(
          payload.create({
            collection,
            overrideAccess: false,
            data: { ...f.base, name: 'Forbidden', slug: 'forbidden-synthetic' },
          }),
        ).rejects.toMatchObject({ status: 403 })
        await expect(
          payload.update({ collection, id, overrideAccess: false, data: { name: 'Forbidden' } }),
        ).rejects.toMatchObject({ status: 403 })
        await expect(
          payload.delete({ collection, id, overrideAccess: false }),
        ).rejects.toMatchObject({ status: 403 })
        await expect(
          payload.findVersions({ collection, overrideAccess: false }),
        ).rejects.toMatchObject({ status: 403 })
      }
    })
    it('drafts remain private by ID, slug, draft=true and facets', async () => {
      for (const [collection, d] of [
        ['specialists', f.draft],
        ['centres', f.draftCentre],
      ] as const) {
        await expect(
          payload.findByID({ collection, id: d.id, overrideAccess: false }),
        ).rejects.toMatchObject({ status: 404 })
        expect(
          (
            await payload.find({
              collection,
              overrideAccess: false,
              draft: true,
              where: { id: { equals: d.id } },
            })
          ).docs,
        ).toHaveLength(0)
      }
      expect(await findPublicSpecialist(payload, f.draft.slug)).toBeNull()
      expect(await findPublicCentre(payload, f.draftCentre.slug)).toBeNull()
      const facets = await directoryFacets(payload, 'specialists')
      expect(facets.cities).not.toContain('დაფარულიქალაქი')
      expect(facets.specializations).not.toContain('დაფარულიმიმართულება')
      expect(facets.centres.some((c) => c.id === f.draftCentre.id)).toBe(false)
    })
    it('Georgian name search combines city, specialization and public centre', async () => {
      expect((await querySpecialists(payload, filters())).totalDocs).toBe(13)
      expect(
        (await querySpecialists(payload, filters({ q: 'ᲡᲘᲜᲗᲔᲢᲘᲙᲣᲠᲘᲪᲜᲝᲑᲐᲠᲘ' }))).totalDocs,
      ).toBe(13)
      expect(
        (
          await querySpecialists(
            payload,
            filters({
              city: 'ქუთაისი',
              specialization: 'სინთეტიკური ულტრაბგერა',
              centre: f.centres[1].slug,
            }),
          )
        ).docs.map((s) => s.id),
      ).toEqual([f.specialists[1].id])
      expect(
        (
          await querySpecialists(
            payload,
            filters({ city: 'ქუთაისი', specialization: 'სინთეტიკური ანგიოლოგია' }),
          )
        ).totalDocs,
      ).toBe(0)
      expect(
        (await queryCentres(payload, filters({ city: 'ქუთაისი' }))).docs.map((c) => c.id),
      ).toEqual([f.centres[1].id])
    })
    it('pagination and URL filters are deterministic, including empty/out-of-range pages', async () => {
      const a = await querySpecialists(payload, filters()),
        b = await querySpecialists(payload, filters({ page: '2' }))
      expect(a.docs).toHaveLength(12)
      expect(b.docs).toHaveLength(1)
      expect(a.docs.some((s) => s.id === b.docs[0].id)).toBe(false)
      const u = new URL(
        directoryURL('specialists', {
          ...filters({
            city: 'თბილისი',
            specialization: 'სინთეტიკური ანგიოლოგია',
            centre: f.centres[0].slug,
          }),
          page: 2,
        }),
        'http://localhost:3105',
      )
      expect(parseDirectoryFilters(Object.fromEntries(u.searchParams))).toMatchObject({
        city: 'თბილისი',
        specialization: 'სინთეტიკური ანგიოლოგია',
        centre: f.centres[0].slug,
        page: 2,
      })
      expect(
        (await querySpecialists(payload, filters({ q: 'არარსებულისინთეტიკური' }))).totalDocs,
      ).toBe(0)
      expect((await querySpecialists(payload, filters({ page: '999' }))).docs).toHaveLength(0)
    })
    it('publish and unpublish have no stale public result', async () => {
      await payload.update({
        collection: 'specialists',
        id: f.draft.id,
        overrideAccess: false,
        user: f.editor,
        data: { _status: 'published' },
      })
      expect(await findPublicSpecialist(payload, f.draft.slug)).not.toBeNull()
      await payload.update({
        collection: 'specialists',
        id: f.draft.id,
        overrideAccess: false,
        user: f.editor,
        data: { _status: 'draft' },
      })
      expect(await findPublicSpecialist(payload, f.draft.slug)).toBeNull()
    })
    it('a new private revision does not replace the published version', async () => {
      for (const [collection, d] of [
        ['specialists', f.specialists[1]],
        ['centres', f.centres[1]],
      ] as const) {
        await payload.update({
          collection,
          id: d.id,
          overrideAccess: false,
          user: f.editor,
          draft: true,
          data: { name: 'დაფარულიახალირევიზია', city: 'ახალიმონახაზისქალაქი', _status: 'draft' },
        })
        const publicDoc =
          collection === 'specialists'
            ? await findPublicSpecialist(payload, d.slug)
            : await findPublicCentre(payload, d.slug)
        expect(publicDoc?.name).toBe(d.name)
        expect(
          (
            await payload.find({
              collection,
              overrideAccess: false,
              draft: true,
              where: { name: { equals: 'დაფარულიახალირევიზია' } },
            })
          ).docs,
        ).toHaveLength(0)
      }
      expect((await directoryFacets(payload, 'specialists')).cities).not.toContain(
        'ახალიმონახაზისქალაქი',
      )
    })
    it('public projections and native query/count/distinct/sort cannot leak private centres', async () => {
      const s = await findPublicSpecialist(payload, f.specialists[0].slug)
      expect(s?.centres.map((c) => c.id)).toEqual([f.centres[0].id])
      expect(s).not.toHaveProperty('_status')
      expect(s).not.toHaveProperty('createdAt')
      const guest = await payload.findByID({
        collection: 'specialists',
        id: f.specialists[0].id,
        overrideAccess: false,
        depth: 10,
      })
      expect(guest.centres).toEqual([f.centres[0].id])
      expect(JSON.stringify(guest)).not.toContain('draft-centre-secret')
      const where = { centres: { equals: f.draftCentre.id } }
      expect(
        (await payload.find({ collection: 'specialists', overrideAccess: false, where })).totalDocs,
      ).toBe(0)
      expect(
        (await payload.count({ collection: 'specialists', overrideAccess: false, where }))
          .totalDocs,
      ).toBe(0)
      await expect(
        payload.find({
          collection: 'specialists',
          overrideAccess: false,
          where: { 'centres.name': { like: f.draftCentre.name } },
        }),
      ).rejects.toMatchObject({ status: 400 })
      await expect(
        payload.findDistinct({
          collection: 'specialists',
          overrideAccess: false,
          field: 'centres',
        }),
      ).rejects.toMatchObject({ status: 400 })
      await expect(
        payload.find({ collection: 'specialists', overrideAccess: false, sort: 'centres.name' }),
      ).rejects.toMatchObject({ status: 400 })
      expect(
        (await querySpecialists(payload, filters({ centre: f.draftCentre.slug }))).totalDocs,
      ).toBe(0)
      expect(
        (
          await querySpecialists(payload, parseDirectoryFilters({ centre: f.centres[0].slug }))
        ).docs.some((s) => s.id === f.draft.id),
      ).toBe(false)
    })
    it('actual Media URLs, optional fields and malformed/missing slugs work', async () => {
      expect((await findPublicSpecialist(payload, f.specialists[0].slug))?.photo?.url).toMatch(
        /^\/api\/media\/file\//,
      )
      expect((await findPublicCentre(payload, f.centres[0].slug))?.image?.url).toMatch(
        /^\/api\/media\/file\//,
      )
      expect(await findPublicSpecialist(payload, f.specialists[12].slug)).toMatchObject({
        photo: null,
        centres: [],
      })
      for (const slug of ['does-not-exist', '%ZZ', '../admin']) {
        expect(await findPublicSpecialist(payload, slug)).toBeNull()
        expect(await findPublicCentre(payload, slug)).toBeNull()
      }
    })
    it('Georgian auto-slugs are bounded, stable and unique', async () => {
      const c = await payload.create({
        collection: 'centres',
        overrideAccess: false,
        user: f.editor,
        data: {
          ...f.centreBase,
          name: `სინთეტიკური ქართული სლაგი ${'წ'.repeat(190)} ${f.suffix}`,
          _status: 'published',
        },
      })
      try {
        expect(c.slug).toContain('სინთეტიკური-ქართული-სლაგი')
        expect(c.slug.length).toBeLessThanOrEqual(180)
        expect(await findPublicCentre(payload, encodeURIComponent(c.slug))).toMatchObject({
          id: c.id,
        })
        expect(
          (
            await payload.update({
              collection: 'centres',
              id: c.id,
              data: { name: 'სხვა სინთეტიკური დასახელება' },
            })
          ).slug,
        ).toBe(c.slug)
        await expect(
          payload.create({
            collection: 'centres',
            data: { ...f.centreBase, name: 'Duplicate', slug: c.slug, _status: 'published' },
          }),
        ).rejects.toBeDefined()
      } finally {
        await payload.delete({ collection: 'centres', id: c.id })
      }
    })
    it('unsafe URLs and incomplete publications are rejected; partial drafts work', async () => {
      for (const collection of ['specialists', 'centres'] as const) {
        await expect(
          payload.create({
            collection,
            data: {
              ...f.base,
              name: 'Unsafe URL fixture',
              website: 'javascript:alert(1)',
              _status: 'published',
            },
          }),
        ).rejects.toMatchObject({ status: 400 })
        await expect(
          payload.create({
            collection,
            data: { ...f.base, name: 'Incomplete', city: '', summary: '', _status: 'published' },
          }),
        ).rejects.toMatchObject({ status: 400 })
        const d = await payload.create({
          collection,
          draft: true,
          data: { name: 'Partial synthetic draft' },
        })
        await payload.delete({ collection, id: d.id })
      }
    })
    it('deleted centre and missing photo relations leave the profile usable', async () => {
      const c = await payload.create({
        collection: 'centres',
        data: { ...f.centreBase, name: 'სინთეტიკური წასაშლელი ცენტრი', _status: 'published' },
      })
      const s = await payload.create({
        collection: 'specialists',
        data: {
          ...f.base,
          name: 'სინთეტიკური კავშირი წაშლილ ცენტრთან',
          centres: [c.id],
          photo: f.media.id,
          _status: 'published',
        },
      })
      try {
        await payload.delete({ collection: 'centres', id: c.id })
        expect((await findPublicSpecialist(payload, s.slug))?.centres).toEqual([])
        await payload.update({ collection: 'specialists', id: s.id, data: { photo: null } })
        expect((await findPublicSpecialist(payload, s.slug))?.photo).toBeNull()
      } finally {
        await payload.delete({ collection: 'specialists', id: s.id })
      }
    })
  },
)
