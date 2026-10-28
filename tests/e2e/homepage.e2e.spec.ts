import { test, expect } from '@playwright/test'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { mkdir } from 'node:fs/promises'
import {
  assertTestDatabase,
  seedHomepageFixture,
  cleanupHomepageFixture,
} from '../helpers/homepageFixture'
import { login } from '../helpers/login'

let payload: Payload
let fixture: Awaited<ReturnType<typeof seedHomepageFixture>> | undefined
let editorID: number | undefined
const editor = {
  email: 'homepage-editor@vaschub.test',
  password: 'ci-only-homepage-editor-password-123',
}
const captures = 'test-results/homepage'

test.describe.serial('VascHub homepage', () => {
  test.beforeAll(async () => {
    assertTestDatabase()
    payload = await getPayload({ config })
    await mkdir(captures, { recursive: true })
  })
  test.afterAll(async () => {
    if (fixture) await cleanupHomepageFixture(payload, fixture)
    if (editorID) await payload.delete({ collection: 'users', id: editorID })
    await payload.destroy()
  })
  test('renders useful empty CMS states', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'ცოდნა ყოველდღიური პრაქტიკისთვის.',
    )
    await expect(page.getByText('გამოქვეყნებული რესურსები ჯერ არ არის.')).toBeVisible()
    await expect(page.locator('.vh-topic-grid a')).toHaveCount(6)
    await page.screenshot({ path: `${captures}/empty-mobile-390.png`, fullPage: true })
  })
  test('loads published content and preserves draft privacy', async ({ page, request }) => {
    fixture = await seedHomepageFixture(payload)
    await page.goto('/')
    await expect(page.locator('[data-testid="resource-card"]')).toHaveCount(3)
    await expect(page.getByText(fixture.draft.title)).toHaveCount(0)
    await expect(page.locator('.vh-featured-course')).toContainText(fixture.posts[2].title)
    await expect(page.locator('.vh-event-card')).toHaveCount(2)
    expect((await request.get('/api/search')).status()).toBe(403)
    await page.goto(`/posts/${fixture.posts[0].slug}`)
    await expect(page.locator('h1')).toContainText(fixture.posts[0].title)
  })
  for (const width of [390, 768, 1440])
    test(`fits Georgian text at ${width}px and captures the real page`, async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 })
      await page.goto('/')
      await page.evaluate(() => document.fonts.ready)
      await expect(page.locator('[data-testid="resource-card"]')).toHaveCount(3)
      const overflow = await page.evaluate(() => ({
        page: document.documentElement.scrollWidth > innerWidth + 1,
        text: Array.from(document.querySelectorAll('main h1, main h2, main h3, main p'))
          .filter((e) => e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1)
          .map((e) => e.textContent),
        logo: Array.from(document.querySelectorAll('.vh-logo img')).every(
          (e) =>
            (e as HTMLImageElement).naturalWidth > 0 &&
            Math.round(e.getBoundingClientRect().width) === 34,
        ),
      }))
      expect(overflow.page).toBe(false)
      expect(overflow.text).toEqual([])
      expect(overflow.logo).toBe(true)
      expect(errors).toEqual([])
      await page.screenshot({ path: `${captures}/homepage-${width}.png`, fullPage: true })
    })
  test('traps menu focus, closes with Escape and restores focus and scrolling', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    const opener = page.getByRole('button', { name: 'მენიუს გახსნა' })
    await opener.click()
    const dialog = page.getByRole('dialog', { name: 'VascHub — მენიუ', exact: true })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'დახურვა', exact: true })).toBeFocused()
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden')
    await page.keyboard.press('Shift+Tab')
    await expect(
      dialog.getByRole('button', { name: 'პირადი კაბინეტი — მალე', exact: true }),
    ).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(dialog.getByRole('button', { name: 'დახურვა', exact: true })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
    await expect(opener).toBeFocused()
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden')
    await opener.click()
    await dialog.getByRole('link', { name: 'აკადემია', exact: true }).click()
    await expect(dialog).not.toBeVisible()
    await expect(page).toHaveURL(/#academy$/)
  })
  test('search submits Georgian text with Enter and shows a real empty result', async ({
    page,
  }) => {
    await page.goto('/')
    const input = page.getByRole('searchbox')
    await input.fill('კაროტიდი')
    await input.press('Enter')
    await expect(page).toHaveURL(/\/search\?q=/)
    await expect(page.locator('[data-testid="resource-card"]')).toHaveCount(1)
    await expect(page.getByText('კაროტიდი — დაფარული სატესტო სტატია')).toHaveCount(0)
    await page.getByRole('searchbox').fill('არარსებულისიტყვისშემოწმება')
    await page.getByRole('searchbox').press('Enter')
    await expect(page.locator('[data-testid="resource-card"]')).toHaveCount(0)
    await expect(
      page.getByText('შესაბამისი გამოქვეყნებული მასალა ვერ მოიძებნა. სცადე სხვა სიტყვა.'),
    ).toBeVisible()
  })
  test('marks membership unavailable without routing to the admin panel', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto('/')
    await page.getByRole('button', { name: 'შესვლა — მალე', exact: true }).click()
    await expect(page.getByRole('dialog', { name: 'წევრის სივრცე მზადდება' })).toBeVisible()
    await expect(page).toHaveURL('http://localhost:3000/')
    await page.keyboard.press('Escape')
  })
  test('publishes a CMS edit through the real admin UI and reflects it publicly', async ({
    page,
    browser,
  }) => {
    const user = await payload.create({
      collection: 'users',
      data: editor,
      context: { bootstrapAdmin: true },
    })
    editorID = user.id
    await login({ page, user: editor })
    await page.goto(`/admin/collections/pages/${fixture!.home.id}`)
    const title = page.getByRole('textbox', { name: 'მთავარი სათაური', exact: true })
    await title.fill('სატესტოდ განახლებული ქართული სათაური')
    await page.getByRole('button', { name: /^Publish( changes)?$/ }).click()
    const publicPage = await browser.newPage()
    await expect
      .poll(async () => {
        await publicPage.goto('http://localhost:3000/')
        return publicPage.locator('h1').textContent()
      })
      .toBe('სატესტოდ განახლებული ქართული სათაური')
    await publicPage.close()
  })
})
