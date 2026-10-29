import { expect, test } from '@playwright/test'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { mkdir } from 'node:fs/promises'
import { cleanupLibraryFixture, seedLibraryFixture, libraryEditor } from '../helpers/libraryFixture'
import { login } from '../helpers/login'

let payload: Payload
let fixture: Awaited<ReturnType<typeof seedLibraryFixture>>

test.describe.serial('Clinical library HTTP and browser workflows', () => {
  test.beforeAll(async () => {
    payload = await getPayload({ config })
    fixture = await seedLibraryFixture(payload)
  })
  test.afterAll(async () => {
    if (fixture) await cleanupLibraryFixture(payload, fixture)
    await payload.destroy()
  })

  test('serves real filters and pagination without publishing drafts', async ({ request }) => {
    const result = await request.get(
      `/library?q=ბიბლიოთეკისძიება&category=${fixture.category.slug}&type=guideline&year=2025&language=en`,
    )
    expect(result.status()).toBe(200)
    const html = await result.text()
    expect(html).toContain(fixture.resources[0].title)
    expect(html).not.toContain(fixture.draft.title)
    const page2 = await request.get('/library?q=ბიბლიოთეკისძიება&page=2')
    expect(page2.status()).toBe(200)
    expect(await page2.text()).toContain('გვერდი')
    const empty = await request.get('/library?q=არარსებულიკვანძი123')
    expect(await empty.text()).toContain('შესაბამისი რესურსი ვერ მოიძებნა.')
  })
  test('denies anonymous draft routes, APIs, versions and protected file URLs', async ({
    request,
  }) => {
    expect((await request.get(`/library/${fixture.draft.slug}`)).status()).toBe(404)
    expect((await request.get(`/library/${fixture.draft.slug}/pdf`)).status()).toBe(404)
    expect((await request.get(`/api/library-resources/${fixture.draft.id}`)).status()).toBe(404)
    expect((await request.get('/api/library-resources/versions')).status()).toBe(403)
    expect((await request.get('/api/library-files')).status()).toBe(403)
    expect((await request.get(`/api/library-files/file/${fixture.file.filename}`)).status()).toBe(
      403,
    )
    expect((await request.get(`/private/library-files/${fixture.file.filename}`)).status()).toBe(
      404,
    )
    const sitemap = await request.get('/library-sitemap.xml')
    expect(await sitemap.text()).toContain(`/library/${fixture.resources[0].slug}`)
    expect(await sitemap.text()).not.toContain(fixture.draft.slug)
  })
  test('downloads only a published attachment with restrictive headers', async ({ request }) => {
    const result = await request.get(`/library/${fixture.resources[0].slug}/pdf`)
    expect(result.status()).toBe(200)
    expect(result.headers()['content-type']).toBe('application/pdf')
    expect(result.headers()['content-disposition']).toContain('attachment;')
    expect(result.headers()['cache-control']).toContain('no-store')
    expect((await result.body()).subarray(0, 5).toString()).toBe('%PDF-')
  })
  test('revokes PDF permission immediately without exposing file metadata', async ({ request }) => {
    await payload.update({
      collection: 'library-files',
      id: fixture.file.id,
      data: { rightsConfirmed: false },
    })
    try {
      expect((await request.get(`/library/${fixture.resources[0].slug}/pdf`)).status()).toBe(404)
      const html = await (await request.get(`/library/${fixture.resources[0].slug}`)).text()
      expect(html).not.toContain('PDF-ის ჩამოტვირთვა')
      expect(html).not.toContain(fixture.file.rightsNote)
    } finally {
      await payload.update({
        collection: 'library-files',
        id: fixture.file.id,
        data: { rightsConfirmed: true },
      })
    }
  })
  test('creates, publishes, edits and deletes a resource through authenticated CMS REST', async ({
    request,
  }) => {
    expect((await request.post('/api/users/login', { data: libraryEditor })).ok()).toBe(true)
    let id: number | undefined
    try {
      const created = await request.post('/api/library-resources', {
        data: {
          ...fixture.base,
          title: 'HTTP სატესტო ჩანაწერი',
          pdf: fixture.file.id,
          _status: 'draft',
        },
      })
      expect(created.status()).toBe(201)
      const doc = (await created.json()).doc
      id = doc.id
      expect((await request.get(`/library/${doc.slug}`)).status()).toBe(404)
      expect(
        (
          await request.patch(`/api/library-resources/${id}`, { data: { _status: 'published' } })
        ).ok(),
      ).toBe(true)
      const published = await request.get(`/library/${doc.slug}`)
      expect(published.status()).toBe(200)
      expect((await request.get(`/library/${doc.slug}/pdf`)).status()).toBe(200)
      expect(await published.text()).toContain('HTTP სატესტო ჩანაწერი')
      expect(
        (
          await request.patch(`/api/library-resources/${id}`, {
            data: { title: 'HTTP განახლებული ჩანაწერი' },
          })
        ).ok(),
      ).toBe(true)
      expect(await (await request.get(`/library/${doc.slug}`)).text()).toContain(
        'HTTP განახლებული ჩანაწერი',
      )
      expect((await request.delete(`/api/library-resources/${id}`)).ok()).toBe(true)
      id = undefined
      expect((await request.get(`/library/${doc.slug}`)).status()).toBe(404)
    } finally {
      if (id) await payload.delete({ collection: 'library-resources', id })
    }
  })
  test('searches and combines filters with keyboard controls', async ({ page }) => {
    await page.goto('/library')
    await page.getByRole('searchbox', { name: 'საძიებო სიტყვა' }).fill('ბიბლიოთეკისძიება')
    await page.getByLabel('კლინიკური თემა', { exact: true }).selectOption(fixture.category.slug!)
    await page.getByLabel('მასალის ტიპი').selectOption('guideline')
    await page.getByLabel('ენა', { exact: true }).selectOption('en')
    await page.getByLabel('გამოცემის წელი', { exact: true }).fill('2025')
    await page.getByRole('searchbox').press('Enter')
    await expect(page.getByTestId('library-card')).toHaveCount(1)
    await page.getByTestId('library-card').click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(fixture.resources[0].title)
    await expect(page.getByRole('link', { name: /ოფიციალური წყარო/ })).toHaveAttribute(
      'href',
      'https://example.org/',
    )
    await expect(page.getByRole('link', { name: /PDF-ის ჩამოტვირთვა/ })).toBeVisible()
  })
  for (const width of [390, 768, 1440])
    test(`fits Georgian library content at ${width}px`, async ({ page }) => {
      await mkdir('test-results/library', { recursive: true })
      await page.setViewportSize({ width, height: 900 })
      for (const [name, url] of [
        ['index', '/library'],
        ['detail', `/library/${fixture.resources[0].slug}`],
      ]) {
        await page.goto(url)
        await page.evaluate(() => document.fonts.ready)
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        ).toBe(true)
        const small = await page.locator('main').evaluate((main) =>
          Array.from(main.querySelectorAll('a,button,input,select'))
            .filter((e) => e.getClientRects().length && e.getBoundingClientRect().height < 43.5)
            .map((e) => e.textContent),
        )
        expect(small).toEqual([])
        await page.screenshot({ path: `test-results/library/${name}-${width}.png`, fullPage: true })
      }
    })
  test('edits and publishes a draft in the existing admin UI', async ({ page }) => {
    await login({ page, user: libraryEditor })
    await page.goto(`/admin/collections/library-resources/${fixture.draft.id}`)
    await page
      .getByRole('textbox', { name: 'სათაური', exact: true })
      .fill('ადმინისტრატორის მიერ გამოქვეყნებული სატესტო მასალა')
    await page.getByRole('button', { name: /^Publish( changes)?$/ }).click()
    await expect
      .poll(async () => {
        await page.goto(`/library/${fixture.draft.slug}`)
        return page.locator('h1').textContent()
      })
      .toBe('ადმინისტრატორის მიერ გამოქვეყნებული სატესტო მასალა')
  })
})
