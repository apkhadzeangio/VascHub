import assert from 'node:assert/strict'
import { getPayload } from 'payload'
import { sql, type MigrateUpArgs, type MigrateDownArgs } from '@payloadcms/db-postgres'
import config from '@/payload.config'
import { migrations } from '@/migrations'
import { assertDirectoryTestDatabase } from '../../helpers/directoryFixture'
assertDirectoryTestDatabase()
const payload = await getPayload({ config }),
  db = payload.db.drizzle
const all = migrations.map((m) => ({
  name: m.name,
  up: (a: unknown) => m.up(a as MigrateUpArgs),
  down: (a: unknown) => m.down(a as MigrateDownArgs),
}))
const directory = all.filter((m) => m.name.endsWith('_specialists_centres_v1')),
  baseline = all.filter((m) => !directory.includes(m))
assert.equal(directory.length, 1)
let categoryID: number | undefined, mediaID: number | undefined
try {
  assert.equal(
    (await db.execute(sql`SELECT to_regclass('public.specialists') AS name`)).rows[0].name,
    null,
    'Use a fresh isolated database for this upgrade proof.',
  )
  await payload.db.migrate({ migrations: baseline })
  categoryID = Number(
    (
      await db.execute(
        sql`INSERT INTO categories (title,slug) VALUES ('Synthetic pre-directory preservation sentinel','synthetic-directory-sentinel') RETURNING id`,
      )
    ).rows[0].id,
  )
  mediaID = Number(
    (
      await db.execute(
        sql`INSERT INTO media (alt) VALUES ('Synthetic pre-directory media preservation sentinel') RETURNING id`,
      )
    ).rows[0].id,
  )
  const columns = async () =>
    (
      await db.execute(
        sql`SELECT table_name,column_name,data_type,is_nullable,column_default FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name,ordinal_position`,
      )
    ).rows
  const before = await columns(),
    names = new Set(before.map((c) => c.table_name))
  const snapshot = async () => {
    const out: Record<string, unknown> = {}
    for (const name of names) {
      if (name === 'payload_migrations') continue
      assert.match(String(name), /^[a-z_0-9]+$/)
      out[String(name)] = (
        await db.execute(
          sql.raw(
            `SELECT count(*)::int AS n,md5(coalesce(json_agg(t ORDER BY t::text)::text,'[]')) AS digest FROM "${name}" t`,
          ),
        )
      ).rows[0]
    }
    return out
  }
  const data = await snapshot()
  await payload.db.migrate({ migrations: directory })
  assert.deepEqual(
    (await columns()).filter(
      (c) => names.has(c.table_name) && c.table_name !== 'payload_locked_documents_rels',
    ),
    before.filter((c) => c.table_name !== 'payload_locked_documents_rels'),
  )
  assert.deepEqual(await snapshot(), data)
  const added = (await columns()).filter(
    (c) =>
      c.table_name === 'payload_locked_documents_rels' &&
      !before.some((b) => b.table_name === c.table_name && b.column_name === c.column_name),
  )
  assert.deepEqual(added.map((c) => c.column_name).sort(), ['centres_id', 'specialists_id'])
  console.log(
    `PASS upgrade: ${names.size} existing tables retain columns, counts and content digests; Category and Media sentinels preserved.`,
  )
  await payload.db.migrateDown()
  assert.deepEqual(await columns(), before)
  assert.deepEqual(await snapshot(), data)
  console.log('PASS isolated rollback: original schema and pre-existing data preserved.')
  await payload.db.migrate({ migrations: directory })
  await payload.db.migrate({ migrations: directory })
  assert.deepEqual(await snapshot(), data)
  console.log('PASS reapply and migration-ledger idempotency.')
} finally {
  if (categoryID) await db.execute(sql`DELETE FROM categories WHERE id=${categoryID}`)
  if (mediaID) await db.execute(sql`DELETE FROM media WHERE id=${mediaID}`)
  await payload.destroy()
}
