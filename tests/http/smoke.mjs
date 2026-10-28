import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const base = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3000'
assert.ok(
  process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD,
  'Set test administrator credentials in ADMIN_EMAIL and ADMIN_PASSWORD.',
)
const slug = `vaschub-smoke-${Date.now()}`
const login = await fetch(base + '/api/users/login', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }),
})
assert.equal(login.status, 200)
const { token } = await login.json()
const headers = { 'content-type': 'application/json', authorization: `JWT ${token}` }
const admin = await fetch(base + '/admin')
assert.equal(admin.status, 200)
const first = await fetch(base + '/api/users/first-register', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: 'blocked@vaschub.test', password: 'not-a-real-password-123' }),
})
assert.equal(first.status, 403)
console.log('PASS login, /admin and blocked first-register')
let pageID, mediaID
try {
  const response = await fetch(base + '/api/pages', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: 'Smoke check',
      slug,
      hero: { type: 'none' },
      layout: [{ blockType: 'content', columns: [{ size: 'full' }] }],
      _status: 'draft',
    }),
  })
  assert.equal(response.status, 201, await response.clone().text())
  const { doc } = await response.json()
  pageID = doc.id
  const anon = await fetch(base + `/api/pages/${pageID}`)
  assert.equal(anon.status, 404)
  const publish = await fetch(base + `/api/pages/${pageID}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ _status: 'published' }),
  })
  assert.equal(publish.status, 200, await publish.clone().text())
  assert.equal((await fetch(base + `/api/pages/${pageID}`)).status, 200)
  assert.equal((await fetch(base + '/' + slug)).status, 200)
  console.log('PASS draft protection, CMS editing, publishing and rendered page')
  const form = new FormData()
  form.set(
    'file',
    new Blob([await readFile('public/favicon.svg')], { type: 'image/svg+xml' }),
    'smoke-icon.svg',
  )
  form.set('_payload', JSON.stringify({ alt: 'Temporary VascHub smoke check' }))
  const upload = await fetch(base + '/api/media', {
    method: 'POST',
    headers: { authorization: `JWT ${token}` },
    body: form,
  })
  assert.equal(upload.status, 201, await upload.clone().text())
  const media = await upload.json()
  mediaID = media.doc.id
  const file = await fetch(base + media.doc.url)
  assert.equal(file.status, 200)
  assert.ok((await file.arrayBuffer()).byteLength > 0)
  console.log('PASS media upload and download')
} finally {
  if (pageID)
    assert.equal(
      (await fetch(base + `/api/pages/${pageID}`, { method: 'DELETE', headers })).status,
      200,
    )
  if (mediaID)
    assert.equal(
      (await fetch(base + `/api/media/${mediaID}`, { method: 'DELETE', headers })).status,
      200,
    )
}
