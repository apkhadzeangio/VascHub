import { test, expect, type Page, type APIRequestContext } from '@playwright/test'
import { mkdir, copyFile } from 'node:fs/promises'
import path from 'node:path'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import type { Header, Footer } from '@/payload-types'
import {
  assertTestDatabase,
  fixtureContext,
  seedHomepageFixture,
  cleanupHomepageFixture,
} from '../../helpers/homepageFixture'

const captures = 'docs/site-completion/agent-a/screenshots'
const archive = 'test-results/homepage/site-ui'
const menuName = 'VascHub — მენიუ'
const longLabel = 'გამოქვეყნებული რესურსების ვრცელი ქართული სანავიგაციო სათაური'
let payload: Payload
let fixture: Awaited<ReturnType<typeof seedHomepageFixture>> | undefined
let originalHeader: Header
let originalFooter: Footer
let editorID: number | undefined
let token: string

async function saveCapture(page: Page, name: string) {
  await page.evaluate(() => document.fonts.ready)
  const file = path.join(captures, name)
  await page.screenshot({ path: file, fullPage: true })
  await copyFile(file, path.join(archive, name))
}
async function expectScrollUnlocked(page: Page) {
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe('hidden')
}
async function updateNavigation(
  request: APIRequestContext,
  slug: 'header' | 'footer',
  navItems: Header['navItems'],
) {
  // Use the existing API so Next's real global-cache invalidation hook runs.
  const result = await request.post(`/api/globals/${slug}`, {
    headers: { Authorization: `JWT ${token}` },
    data: { navItems },
  })
  expect(result.ok()).toBeTruthy()
}

test.describe.serial('Isolated VascHub site UI', () => {
  test.beforeAll(async ({ baseURL, request }) => {
    assertTestDatabase()
    const database = new URL(process.env.DATABASE_URL || '')
    if (
      !baseURL ||
      !['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname) ||
      !['localhost', '127.0.0.1'].includes(database.hostname)
    ) throw new Error('Site UI tests require loopback app and dedicated local test database.')
    payload = await getPayload({ config, key: 'e2e-site-ui' })
    originalHeader = await payload.findGlobal({ slug: 'header', depth: 0 })
    originalFooter = await payload.findGlobal({ slug: 'footer', depth: 0 })
    const editor = {
      email: `site-ui-${Date.now()}@vaschub.test`,
      password: 'ci-only-site-ui-test-password-123',
    }
    editorID = (await payload.create({
      collection: 'users', data: editor, context: { bootstrapAdmin: true },
    })).id
    const login = await request.post('/api/users/login', { data: editor })
    expect(login.ok()).toBeTruthy()
    token = (await login.json()).token
    await updateNavigation(request, 'header', [
      { link: { type: 'custom', label: 'კლინიკური ბიბლიოთეკა', url: '/library' } },
      { link: { type: 'custom', label: 'აკადემია', url: '/#academy' } },
      { link: { type: 'custom', label: 'ღონისძიებები', url: '/#events' } },
      { link: { type: 'custom', label: longLabel, url: '/#resources' } },
      { link: { type: 'custom', label: 'სტატიები და სიახლეები', url: '/posts' } },
      { link: { type: 'custom', label: 'მიუწვდომელი მიმართულება', url: '/admin' } },
    ])
    await updateNavigation(request, 'footer', [
      { link: { type: 'custom', label: longLabel, url: '/#resources' } },
      { link: { type: 'custom', label: 'საკონტაქტო ინფორმაცია', url: '/api/users' } },
      { link: { type: 'custom', label: 'არასწორი ბმული', url: 'javascript:alert(1)' } },
      { link: { type: 'custom', label: 'გარე რესურსი', url: 'https://example.org/', newTab: true } },
    ])
    // "max" cache invalidation can serve one stale response before refreshing.
    await expect.poll(async () => {
      const html = await (await request.get('/')).text()
      return html.includes(longLabel) && html.includes('არასწორი ბმული')
    }).toBe(true)
    await mkdir(captures, { recursive: true })
    await mkdir(archive, { recursive: true })
  })
  test.afterAll(async ({ request }) => {
    if (!payload) return
    try {
      if (originalHeader && token)
        await updateNavigation(request, 'header', originalHeader.navItems)
      if (originalFooter && token)
        await updateNavigation(request, 'footer', originalFooter.navItems)
    } finally {
      if (fixture) await cleanupHomepageFixture(payload, fixture)
      if (editorID) await payload.delete({ collection: 'users', id: editorID })
      await payload.destroy()
    }
  })

  test('keeps empty sections honest before test-only content is created', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await expect(page.locator('.vh-resources')).toContainText('გამოქვეყნებული რესურსები ჯერ არ არის.')
    await expect(page.locator('.vh-academy')).toContainText('სასწავლო მასალა მოგვიანებით დაემატება.')
    await expect(page.locator('.vh-academy a')).toHaveCount(0)
    await saveCapture(page, 'empty-390.png')
    fixture = await seedHomepageFixture(payload)
  })

  for (const width of [390, 768, 1440])
    test(`supports long Georgian labels, focus and resource links at ${width}px`, async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 })
      await page.goto('/')
      await expect(page.locator('[data-testid="resource-card"]')).toHaveCount(3)
      await expect(page.getByText(fixture!.draft.title)).toHaveCount(0)
      await page.evaluate(() => document.fonts.ready)
      expect(await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        clipped: [...document.querySelectorAll('main h1, main h2, main h3, main p, footer a')]
          .filter((element) =>
            element.getClientRects().length &&
            !element.classList.contains('sr-only') &&
            (element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1),
          ).map((element) => element.textContent),
      }))).toEqual({ overflow: false, clipped: [] })
      await page.keyboard.press('Tab')
      await expect(page.getByRole('link', { name: 'კონტენტზე გადასვლა' })).toBeFocused()
      await page.keyboard.press('Enter')
      await expect(page.locator('#main-content')).toBeFocused()
      await saveCapture(page, `homepage-${width}.png`)
      await page.locator('.vh-resource-link').first().click()
      await expect(page.locator('h1')).toHaveText(fixture!.posts[0].title)
      expect(errors).toEqual([])
    })

  test('preserves configured section links and reaches library, posts and anchors', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto('/')
    const nav = page.locator('.vh-desktop-nav')
    await expect(nav.getByRole('link', { name: longLabel })).toHaveAttribute('href', '/#resources')
    await nav.getByRole('link', { name: longLabel }).click()
    await expect(page).toHaveURL(/\/#resources$/)
    await expect(page.locator('#resources')).toBeInViewport()
    await nav.getByRole('link', { name: 'კლინიკური ბიბლიოთეკა', exact: true }).click()
    await expect(page).toHaveURL(/\/library$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('კლინიკური ბიბლიოთეკა')
    await page.goto('/')
    await page.locator('.vh-desktop-nav').getByRole('link', { name: 'სტატიები და სიახლეები' }).click()
    await expect(page).toHaveURL(/\/posts$/)
    await expect(page.locator('main')).toBeVisible()
  })

  test('disables unavailable footer destinations and keeps external link semantics', async ({ page }) => {
    await page.goto('/')
    const footer = page.locator('footer')
    await expect(footer.locator('a[href^="javascript:"], a[href^="/admin"], a[href^="/api"]')).toHaveCount(0)
    await expect(footer.getByRole('link', { name: longLabel })).toHaveAttribute('href', '/#resources')
    const external = footer.getByRole('link', { name: 'გარე რესურსი' })
    await expect(external).toHaveAttribute('target', '_blank')
    await expect(external).toHaveAttribute('rel', 'noopener noreferrer')
    await footer.getByRole('button', { name: 'საკონტაქტო ინფორმაცია მალე' }).click()
    await expect(page.getByRole('dialog', { name: 'საკონტაქტო ინფორმაცია' }))
      .toContainText('ამ ეტაპზე ხელმისაწვდომი არ არის')
    await page.keyboard.press('Escape')
    await expectScrollUnlocked(page)
  })

  test('restores preexisting body overflow after a nested menu notice closes', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.evaluate(() => { document.body.style.overflow = 'auto' })
    const opener = page.getByRole('button', { name: 'მენიუს გახსნა' })
    await opener.click()
    await expect(opener).toHaveAttribute('aria-expanded', 'true')
    const menu = page.getByRole('dialog', { name: menuName, exact: true })
    const account = menu.getByRole('button', { name: 'პირადი კაბინეტი — მალე', exact: true })
    await account.click()
    const notice = page.getByRole('dialog', { name: 'წევრის სივრცე მზადდება', exact: true })
    await expect(notice).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(notice).not.toBeVisible()
    await expect(account).toBeFocused()
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden')
    await page.keyboard.press('Escape')
    await expect(menu).not.toBeVisible()
    await expect(opener).toBeFocused()
    await expect(opener).toHaveAttribute('aria-expanded', 'false')
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('auto')
  })

  test('traps menu focus and closes by button, backdrop and section navigation', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1000 })
    await page.goto('/')
    const opener = page.getByRole('button', { name: 'მენიუს გახსნა' })
    const menu = page.getByRole('dialog', { name: menuName, exact: true })
    await opener.click()
    const close = menu.getByRole('button', { name: 'დახურვა', exact: true })
    await expect(close).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(menu.getByRole('button', { name: 'პირადი კაბინეტი — მალე', exact: true })).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(close).toBeFocused()
    await saveCapture(page, 'menu-768.png')
    await close.click()
    await expectScrollUnlocked(page)
    await opener.click()
    await page.mouse.click(20, 300)
    await expect(menu).not.toBeVisible()
    await expect(opener).toBeFocused()
    await opener.click()
    await menu.getByRole('link', { name: 'აკადემია', exact: true }).click()
    await expect(menu).not.toBeVisible()
    await expect(page.locator('#academy')).toBeInViewport()
    await expectScrollUnlocked(page)
  })

  test('releases the menu and nested notice when switching to desktop', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.getByRole('button', { name: 'მენიუს გახსნა' }).click()
    await page.getByRole('dialog', { name: menuName, exact: true })
      .getByRole('button', { name: 'შესვლა — მალე', exact: true }).click()
    await page.setViewportSize({ width: 1440, height: 1000 })
    await expect(page.locator('dialog[open]')).toHaveCount(0)
    await expectScrollUnlocked(page)
    await expect(page.locator('.vh-desktop-nav')).toBeVisible()
    await page.setViewportSize({ width: 390, height: 844 })
    await page.getByRole('button', { name: 'მენიუს გახსნა' }).click()
    await expect(page.getByRole('dialog', { name: menuName, exact: true })).toBeVisible()
    await page.keyboard.press('Escape')
    await expectScrollUnlocked(page)
  })

  test('submits trimmed Georgian queries with Enter and button and exposes real empty results', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    const input = page.getByRole('searchbox')
    await expect(input).toHaveAttribute('enterkeyhint', 'search')
    await expect(input).toHaveAttribute('aria-describedby', 'homepage-search-hint')
    await input.fill('  კაროტიდი  ')
    await input.press('Enter')
    expect(new URL(page.url()).searchParams.get('q')).toBe('კაროტიდი')
    await expect(page.locator('[data-testid="resource-card"]')).toHaveCount(1)
    await expect(page.getByRole('status')).toContainText('მოიძებნა: 1')
    await expect(page.getByText(fixture!.draft.title)).toHaveCount(0)
    await saveCapture(page, 'search-results-390.png')
    await page.getByRole('searchbox').fill('არარსებულისიტყვისშემოწმება')
    await page.getByRole('button', { name: 'ძიება', exact: true }).click()
    await expect(page.getByRole('status')).toContainText('მოიძებნა: 0')
    await expect(page.locator('.vh-empty-state'))
      .toContainText('შესაბამისი გამოქვეყნებული მასალა ვერ მოიძებნა.')
    await expect(page.getByRole('searchbox')).toHaveValue('არარსებულისიტყვისშემოწმება')
    await saveCapture(page, 'search-empty-390.png')
    await page.getByRole('searchbox').fill('   ')
    await page.getByRole('searchbox').press('Enter')
    expect(new URL(page.url()).searchParams.get('q')).toBe('')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('სტატიების ძიება')
    await expect(page.locator('[data-testid="resource-card"]')).toHaveCount(3)
  })
})
