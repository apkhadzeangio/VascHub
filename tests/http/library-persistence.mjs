import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { readFile, writeFile, unlink } from 'node:fs/promises'
import path from 'node:path'

// This destructive fixture is restricted to a dedicated local/CI test database.
const database = new URL(process.env.DATABASE_URL || '').pathname
assert.match(
  database,
  /(?:_|-)test$/,
  'Library persistence checks require a dedicated *_test database.',
)
const base = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3000'
const mode = process.argv[2]
assert.ok(['prepare', 'verify'].includes(mode), 'Use prepare before restart, verify after restart.')
assert.ok(process.env.LIBRARY_FILES_DIR, 'Set the protected persistent upload directory.')
assert.ok(
  process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD,
  'Set test administrator credentials.',
)
const stateFile = path.join(process.env.LIBRARY_FILES_DIR, '.persistence-smoke.json')
const login = await fetch(`${base}/api/users/login`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }),
})
assert.equal(login.status, 200)
const { token } = await login.json()
async function adminRequest(collection, method, data) {
  const form = data instanceof FormData
  const response = await fetch(`${base}/api/${collection}`, {
    method,
    headers: {
      authorization: `JWT ${token}`,
      ...(form ? {} : { 'content-type': 'application/json' }),
    },
    body: data ? (form ? data : JSON.stringify(data)) : undefined,
  })
  assert.ok(response.ok, `Test CMS request failed: ${method} ${collection}: ${response.status}`)
  return response.json()
}
function testPDF() {
  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 300] /Resources << >> /Contents 4 0 R >>',
    '<< /Length 0 >>\nstream\n\nendstream',
  ]
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(pdf))
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  }
  const xref = Buffer.byteLength(pdf)
  pdf += `xref\n0 5\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((o) => `${String(o).padStart(10, '0')} 00000 n \n`)
    .join('')}trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return Buffer.from(pdf)
}
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex')
async function publicDownload(state) {
  const response = await fetch(`${base}/library/${state.slug}/pdf`)
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('content-type'), 'application/pdf')
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
  assert.match(response.headers.get('cache-control'), /no-store/)
  assert.equal(digest(Buffer.from(await response.arrayBuffer())), state.hash)
  for (const filename of [state.filename, `library-private%2F${state.filename}`]) {
    const collection = filename.includes('%2F') ? 'media' : 'library-files'
    assert.ok(
      [403, 404].includes((await fetch(`${base}/api/${collection}/file/${filename}`)).status),
    )
  }
}
async function cleanup(state) {
  for (const [collection, key] of [
    ['library-resources', 'resource'],
    ['library-files', 'file'],
    ['library-topics', 'topic'],
    ['library-document-types', 'type'],
    ['library-organizations', 'organization'],
  ]) {
    if (state[key]) await adminRequest(`${collection}/${state[key]}`, 'DELETE')
  }
  await unlink(stateFile).catch((error) => {
    if (error.code !== 'ENOENT') throw error
  })
}
if (mode === 'prepare') {
  const suffix = randomUUID()
  const state = { slug: `persistence-test-${suffix}` }
  try {
    for (const [collection, key] of [
      ['library-topics', 'topic'],
      ['library-document-types', 'type'],
      ['library-organizations', 'organization'],
    ]) {
      state[key] = (
        await adminRequest(collection, 'POST', {
          title: `Persistence test ${key}`,
          slug: `${key}-${suffix}`,
        })
      ).doc.id
    }
    const bytes = testPDF()
    const form = new FormData()
    form.set('file', new Blob([bytes], { type: 'application/pdf' }), 'test-only.pdf')
    form.set(
      '_payload',
      JSON.stringify({
        title: 'სატესტო ცარიელი PDF',
        rightsConfirmed: true,
        rightsNote: 'Programmatically generated empty test document.',
      }),
    )
    const file = (await adminRequest('library-files', 'POST', form)).doc
    state.file = file.id
    state.filename = file.filename
    state.hash = digest(bytes)
    const resource = (
      await adminRequest('library-resources', 'POST', {
        title: 'სატესტო მუდმივი ფაილი — კლინიკური შინაარსის გარეშე',
        slug: state.slug,
        summary: 'Only tests file persistence and revocation; no clinical content.',
        documentType: state.type,
        clinicalTopics: [state.topic],
        publisherOrganization: state.organization,
        language: 'en',
        publicationYear: new Date().getUTCFullYear(),
        officialSourceUrl: 'https://example.org/',
        lastReviewedAt: new Date().toISOString(),
        attachment: state.file,
        attachmentType: 'pdf',
        accessType: 'hosted',
        licenseStatus: 'owned',
        rightsEvidence: 'Programmatically generated empty test PDF.',
        _status: 'published',
        visibility: 'public',
      })
    ).doc
    state.resource = resource.id
    await publicDownload(state)
    await writeFile(stateFile, JSON.stringify(state))
    console.log('PASS protected test PDF prepared on persistent volume')
  } catch (error) {
    await cleanup(state)
    throw error
  }
} else {
  const state = JSON.parse(await readFile(stateFile, 'utf8'))
  try {
    await publicDownload(state)
    await adminRequest(`library-files/${state.file}`, 'PATCH', { rightsConfirmed: false })
    assert.equal((await fetch(`${base}/library/${state.slug}/pdf`)).status, 404)
    assert.ok(
      !(await (await fetch(`${base}/library/${state.slug}`)).text()).includes('PDF-ის ჩამოტვირთვა'),
    )
    console.log(
      'PASS protected PDF survives restart with identical bytes; permission revocation blocks public downloads',
    )
  } finally {
    await cleanup(state)
  }
}
