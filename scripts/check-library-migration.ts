import { getPayload, createLocalReq } from 'payload'
import config from '../src/payload.config'
import { down, up } from '../src/migrations/20261028_221853_clinical_library_v01'
import { assertTestDatabase, demoContent, fixtureContext } from '../tests/helpers/homepageFixture'

// Run only on the disposable test database, after integration fixtures are cleaned up.
assertTestDatabase()
const payload = await getPayload({ config })
const req = await createLocalReq({}, payload)
const resources = await payload.count({ collection: 'library-resources' })
const files = await payload.count({ collection: 'library-files' })
if (resources.totalDocs || files.totalDocs)
  throw new Error('Migration verification requires an empty test library.')
const suffix = Date.now()
const category = await payload.create({
  collection: 'categories',
  data: { title: 'მიგრაციის საკონტროლო კატეგორია', slug: `migration-sentinel-${suffix}` },
})
const post = await payload.create({
  collection: 'posts',
  context: fixtureContext,
  data: {
    title: 'მიგრაციის საკონტროლო სტატია',
    slug: `migration-sentinel-${suffix}`,
    content: demoContent,
    categories: [category.id],
    _status: 'published',
  },
})
const before = await payload.findByID({ collection: 'posts', id: post.id, depth: 0 })
const categoriesBefore = await payload.count({ collection: 'categories' })
try {
  await down({ db: payload.db.drizzle, payload, req })
  const afterDown = await payload.findByID({ collection: 'posts', id: post.id, depth: 0 })
  if (JSON.stringify(before) !== JSON.stringify(afterDown))
    throw new Error('Rollback changed an existing post.')
  await up({ db: payload.db.drizzle, payload, req })
  const afterUp = await payload.findByID({ collection: 'posts', id: post.id, depth: 0 })
  if (JSON.stringify(before) !== JSON.stringify(afterUp))
    throw new Error('Upgrade changed an existing post.')
  if ((await payload.count({ collection: 'categories' })).totalDocs !== categoriesBefore.totalDocs)
    throw new Error('Upgrade duplicated taxonomy.')
  payload.logger.info(
    'Library rollback/reapply passed; existing post, relationships and taxonomy preserved.',
  )
} finally {
  await payload.delete({ collection: 'posts', id: post.id, context: fixtureContext })
  await payload.delete({ collection: 'categories', id: category.id })
  await payload.destroy()
}
