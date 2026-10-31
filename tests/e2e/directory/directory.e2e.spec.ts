import { test, expect } from '@playwright/test'
import { getPayload, type Payload } from 'payload'
import { mkdir } from 'node:fs/promises'
import config from '@/payload.config'
import {
  cleanupDirectoryFixture,
  seedDirectoryFixture,
  assertDirectoryTestDatabase,
} from '../../helpers/directoryFixture'
import { profileURL } from '@/Directory/values'
test.skip(
  process.env.DIRECTORY_TESTS !== '1',
  'Run this module with its isolated directory Playwright config.',
)

let payload: Payload
let f: Awaited<ReturnType<typeof seedDirectoryFixture>>
test.beforeAll(async () => {
  assertDirectoryTestDatabase()
  payload = await getPayload({ config })
  f = await seedDirectoryFixture(payload)
  await mkdir('docs/directory/screenshots', { recursive: true })
})
test.afterAll(async () => {
  try {
    if (f) await cleanupDirectoryFixture(payload, f)
  } finally {
    if (payload) await payload.destroy()
  }
})
test('native anonymous API denies writes, drafts and private relationship queries', async ({
  request,
}) => {
  for (const [collection, pub, draft] of [
    ['specialists', f.specialists[0], f.draft],
    ['centres', f.centres[0], f.draftCentre],
  ] as const) {
    expect(
      (
        await request.post(`/api/${collection}`, { data: { ...f.base, name: 'Forbidden' } })
      ).status(),
    ).toBe(403)
    expect(
      (
        await request.patch(`/api/${collection}/${pub.id}`, { data: { name: 'Forbidden' } })
      ).status(),
    ).toBe(403)
    expect((await request.delete(`/api/${collection}/${pub.id}`)).status()).toBe(403)
    expect((await request.get(`/api/${collection}/${draft.id}?draft=true`)).status()).toBe(404)
    expect((await request.get(`/api/${collection}/versions`)).status()).toBe(403)
  }
  const s = await (await request.get(`/api/specialists/${f.specialists[0].id}?depth=10`)).json()
  expect(s.centres).toEqual([f.centres[0].id])
  expect(JSON.stringify(s)).not.toContain('draft-centre-secret')
  const filtered = await request.get(`/api/specialists?where[centres][equals]=${f.draftCentre.id}`)
  expect(filtered.status()).toBe(200)
  expect((await filtered.json()).totalDocs).toBe(0)
  expect(
    (
      await request.get(
        `/api/specialists?where[centres.name][like]=${encodeURIComponent(f.draftCentre.name)}`,
      )
    ).status(),
  ).toBe(400)
})
test('Georgian search combines filters, resets page, persists on refresh and clears', async ({
  page,
}) => {
  await page.goto('/specialists?page=2')
  const form = page.getByRole('form', { name: 'ცნობარის ძიება და ფილტრები' })
  await form.getByLabel('სახელი და გვარი').fill('სინთეტიკურიცნობარი')
  await form.getByLabel('ქალაქი', { exact: true }).selectOption('ქუთაისი')
  await form.getByLabel('სპეციალიზაცია', { exact: true }).selectOption('სინთეტიკური ულტრაბგერა')
  await form.getByLabel('ცენტრი', { exact: true }).selectOption(f.centres[1].slug)
  await form.getByRole('button', { name: 'ძებნა', exact: true }).click()
  await expect(page.locator('[data-directory-card="specialist"]')).toHaveCount(1)
  const u = new URL(page.url())
  expect(u.searchParams.get('q')).toBe('სინთეტიკურიცნობარი')
  expect(u.searchParams.get('city')).toBe('ქუთაისი')
  expect(u.searchParams.get('specialization')).toBe('სინთეტიკური ულტრაბგერა')
  expect(u.searchParams.get('centre')).toBe(f.centres[1].slug)
  expect(u.searchParams.has('page')).toBe(false)
  await page.reload()
  await expect(form.getByLabel('ქალაქი', { exact: true })).toHaveValue('ქუთაისი')
  await expect(page.locator('#directory-results').locator('..').getByRole('status')).toHaveText(
    'მოიძებნა: 1',
  )
  await form.getByRole('link', { name: 'ფილტრების გასუფთავება' }).click()
  await expect(page).toHaveURL(/\/specialists$/)
  await expect(page.locator('[data-directory-card="specialist"]')).toHaveCount(12)
})
test('pagination preserves Georgian search and browser back restores it', async ({ page }) => {
  await page.goto(`/specialists?q=${encodeURIComponent('სინთეტიკურიცნობარი')}`)
  await page.getByRole('link', { name: 'შემდეგი გვერდი' }).click()
  await expect(page.locator('[data-directory-card="specialist"]')).toHaveCount(1)
  expect(new URL(page.url()).searchParams.get('page')).toBe('2')
  expect(new URL(page.url()).searchParams.get('q')).toBe('სინთეტიკურიცნობარი')
  await page.goBack()
  await expect(page.locator('[data-directory-card="specialist"]')).toHaveCount(12)
  await expect(page.getByLabel('სახელი და გვარი')).toHaveValue('სინთეტიკურიცნობარი')
})
test('centre name/city filters and internal navigation work', async ({ page }) => {
  await page.goto('/centres')
  await page.getByLabel('ცენტრის დასახელება').fill('სინთეტიკურიცნობარი')
  await page.getByLabel('ქალაქი', { exact: true }).selectOption('ქუთაისი')
  await page.getByRole('button', { name: 'ძებნა', exact: true }).click()
  await expect(page.locator('[data-directory-card="centre"]')).toHaveCount(1)
  await page
    .getByRole('navigation', { name: 'პროფესიული ცნობარი', exact: true })
    .getByRole('link', { name: 'სპეციალისტები', exact: true })
    .click()
  await expect(page).toHaveURL(/\/specialists$/)
})
test('both relationship directions expose published profiles only', async ({ page }) => {
  await page.goto(profileURL('specialists', f.specialists[0]))
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(f.specialists[0].name)
  await expect(page.locator('main')).not.toContainText(f.draftCentre.name)
  await page.getByRole('link', { name: `${f.centres[0].name} · თბილისი`, exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(f.centres[0].name)
  await expect(page.locator('main')).not.toContainText(f.draft.name)
  await expect(page.getByRole('link', { name: f.specialists[0].name, exact: true })).toBeVisible()
})
test('optional fields, empty results and actual HTTP 404 work', async ({ page }) => {
  await page.goto(profileURL('specialists', f.specialists[12]))
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(f.specialists[12].name)
  await expect(page.locator('main')).not.toContainText('საჯარო საკონტაქტო ინფორმაცია')
  await expect(page.locator('main .vd-photo svg')).toBeVisible()
  await page.goto('/specialists?q=არარსებულისინთეტიკური')
  await expect(page.getByRole('heading', { name: 'შესაბამისი პროფილი ვერ მოიძებნა' })).toBeVisible()
  for (const path of [
    '/specialists/synthetic-does-not-exist',
    '/centres/synthetic-does-not-exist',
    profileURL('specialists', f.draft),
    profileURL('centres', f.draftCentre),
  ]) {
    expect((await page.goto(path))?.status(), path).toBe(404)
    await expect(page.locator('body')).not.toContainText('draft-centre-secret')
  }
})
test('native CMS edit persists; administrator cookies cannot expose public drafts', async ({
  page,
}) => {
  expect((await page.request.post('/api/users/login', { data: f.credentials })).ok()).toBe(true)
  await page.goto(`/admin/collections/centres/${f.centres[0].id}`)
  const summary = page.locator('#field-summary')
  await expect(summary).toBeVisible()
  await summary.fill(`${f.centres[0].summary}\nსინთეტიკური CMS რედაქტირება წარმატებულია.`)
  const saved = page.waitForResponse(
    (r) =>
      r.request().method() === 'PATCH' &&
      new URL(r.url()).pathname === `/api/centres/${f.centres[0].id}`,
  )
  await page.getByRole('button', { name: 'Publish changes', exact: true }).click()
  expect((await saved).status()).toBe(200)
  await page.goto(profileURL('centres', f.centres[0]))
  await expect(page.locator('main')).toContainText('სინთეტიკური CMS რედაქტირება წარმატებულია.')
  await page.goto('/specialists?draft=true')
  await expect(page.locator('.vh-directory')).not.toContainText(f.draft.name)
  await page.goto('/centres?draft=true')
  await expect(page.locator('.vh-directory')).not.toContainText(f.draftCentre.name)
  expect((await page.goto(profileURL('specialists', f.draft)))?.status()).toBe(404)
  await page.context().clearCookies()
})
test('actual Media images load for both profile types', async ({ page }) => {
  for (const path of [
    profileURL('specialists', f.specialists[0]),
    profileURL('centres', f.centres[0]),
  ]) {
    await page.goto(path)
    const img = page.locator('main > article > header .vd-photo img')
    await expect(img).toBeVisible()
    await expect
      .poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
      .toBe(true)
    const response = await page.request.get((await img.getAttribute('src'))!)
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('image/png')
  }
})
test('a missing media file falls back to a neutral icon', async ({ page }) => {
  await page.route('**/api/media/file/**', (route) => route.fulfill({ status: 404, body: '' }))
  await page.goto(profileURL('specialists', f.specialists[0]))
  await expect(page.locator('main .vd-photo svg')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(f.specialists[0].name)
})
test('keyboard focus reaches filters and submit with a visible outline', async ({ page }) => {
  await page.goto('/specialists')
  const input = page.getByLabel('სახელი და გვარი')
  await input.focus()
  await expect(input).toBeFocused()
  const outline = await input.evaluate((el) => ({
    style: getComputedStyle(el).outlineStyle,
    width: getComputedStyle(el).outlineWidth,
  }))
  expect(outline.style).not.toBe('none')
  expect(parseFloat(outline.width)).toBeGreaterThanOrEqual(2)
  for (const label of ['ქალაქი', 'სპეციალიზაცია', 'ცენტრი']) {
    await page.keyboard.press('Tab')
    await expect(page.getByLabel(label, { exact: true })).toBeFocused()
  }
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'ძებნა', exact: true })).toBeFocused()
})
for (const width of [390, 768, 1440])
  test(`all four responsive layouts at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    for (const [name, path] of [
      ['specialists', '/specialists'],
      ['specialist', profileURL('specialists', f.specialists[0])],
      ['centres', '/centres'],
      ['centre', profileURL('centres', f.centres[0])],
    ]) {
      await page.goto(path)
      await expect(page.locator('.vh-directory h1')).toBeVisible()
      await page.evaluate(() => document.fonts.ready)
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        `${name} overflows at ${width}`,
      ).toBe(true)
      expect(
        await page
          .locator('.vd-filters input,.vd-filters select,.vd-filters button')
          .evaluateAll((els) => els.filter((e) => e.getBoundingClientRect().height < 44).length),
      ).toBe(0)
      await page.screenshot({
        path: `docs/directory/screenshots/${name}-${width}.png`,
        fullPage: true,
      })
    }
  })
test('an empty published directory has a complete empty state', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 })
  try {
    await payload.update({
      collection: 'specialists',
      where: { id: { in: f.specialists.map((s) => s.id) } },
      overrideAccess: false,
      user: f.editor,
      data: { _status: 'draft' },
    })
    await payload.update({
      collection: 'centres',
      where: { id: { in: f.centres.map((c) => c.id) } },
      overrideAccess: false,
      user: f.editor,
      data: { _status: 'draft' },
    })
    for (const kind of ['specialists', 'centres']) {
      await page.goto(`/${kind}`)
      await expect(page.getByRole('heading', { name: 'ცნობარი მზადდება' })).toBeVisible()
      await expect(page.locator('#directory-results').locator('..').getByRole('status')).toHaveText(
        'მოიძებნა: 0',
      )
      await page.screenshot({
        path: `docs/directory/screenshots/${kind}-empty-390.png`,
        fullPage: true,
      })
    }
  } finally {
    await payload.update({
      collection: 'centres',
      where: { id: { in: f.centres.map((c) => c.id) } },
      data: { _status: 'published' },
    })
    await payload.update({
      collection: 'specialists',
      where: { id: { in: f.specialists.map((s) => s.id) } },
      data: { _status: 'published' },
    })
  }
})
