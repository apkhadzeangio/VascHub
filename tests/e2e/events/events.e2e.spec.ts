import { expect, test, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { login } from '../../helpers/login'
import { cleanupTestUser, seedTestUser, testUser } from '../../helpers/seedUser'
import {
  cleanupEventsFixture,
  seedEventsFixture,
  setHomeEvents,
  type EventsFixture,
} from '../../int/events/fixture'

// Resolved from the active Playwright project, so the same spec runs under the default config
// (port 3000, CI) and under tests/e2e/events/playwright.events.config.ts (port 3104).
let BASE = ''
const DAY = 86_400_000
const PAGE_SIZE = 12
const EXTRA = 13 // 4 named posts + 13 extra + 1 external notice = 18 items → 2 pages
const TOTAL = 4 + EXTRA + 1
const EXTERNAL_PAST = 'გარე ჩატარებული კონფერენცია'

let payload: Payload
let fixture: EventsFixture

const cards = (page: Page) => page.getByTestId('event-card')
const total = (page: Page) => page.getByTestId('events-total')
const form = (page: Page) => page.getByRole('search', { name: /ღონისძიებებისა/ })

async function screenshot(page: Page, name: string) {
  const dir = process.env.EVENTS_SCREENSHOT_DIR
  if (!dir) return
  await mkdir(dir, { recursive: true })
  await page.screenshot({
    path: path.join(dir, `${name}.jpg`),
    type: 'jpeg',
    quality: 72,
    fullPage: true,
  })
}

test.describe.serial('Events & Professional Development (/events)', () => {
  test.beforeAll(async ({}, testInfo) => {
    BASE = testInfo.project.use.baseURL!.replace(/\/$/, '')
    payload = await getPayload({ config, key: 'events-e2e' })
    fixture = await seedEventsFixture(payload, { extraDevelopment: EXTRA })
    await setHomeEvents(payload, fixture, [
      {
        title: 'კონგრესის მოკლე ცნობა',
        date: new Date(Date.now() + 45 * DAY).toISOString(),
        location: 'სატესტო ქალაქი',
        url: `/posts/${fixture.posts.congress.slug}`,
      },
      {
        title: EXTERNAL_PAST,
        date: new Date(Date.now() - 45 * DAY).toISOString(),
        location: 'სატესტო ადგილი',
        url: 'https://example.org/past-congress',
      },
    ])
    await seedTestUser()
  })
  test.afterAll(async () => {
    await cleanupTestUser().catch(() => undefined)
    if (fixture) await cleanupEventsFixture(payload, fixture)
    await payload.destroy()
  })

  test('lists published items first page, hides drafts and unrelated posts', async ({ page }) => {
    const response = await page.goto('/events')
    expect(response?.status()).toBe(200)
    await expect(
      page.getByRole('heading', { level: 1, name: 'ღონისძიებები და პროფესიული განვითარება' }),
    ).toBeVisible()
    await expect(total(page)).toHaveText(`მოიძებნა: ${TOTAL}`)
    await expect(cards(page)).toHaveCount(PAGE_SIZE)
    const html = await page.content()
    expect(html).not.toContain(fixture.posts.draft.title)
    expect(html).not.toContain(fixture.posts.unrelated.title)
  })

  test('shows confirmed dates and places only, and says so when a date is unknown', async ({
    page,
  }) => {
    await page.goto('/events')
    const first = cards(page).first()
    await expect(first).toContainText(fixture.posts.congress.title)
    await expect(first).toHaveAttribute('data-status', 'upcoming')
    await expect(first.locator('time')).toHaveCount(1)
    await expect(first).toContainText('სატესტო ქალაქი')
    // Undated items sort after dated upcoming ones; find this one by search, not by position.
    await page.goto('/events?q=Fellowship')
    const undated = cards(page).filter({ hasText: fixture.posts.fellowship.title })
    await expect(undated).toHaveAttribute('data-status', 'undated')
    await expect(undated).toContainText('თარიღი დასაზუსტებელია')
    await expect(undated.locator('time')).toHaveCount(0)
    await page.goto('/events?page=2')
    const past = cards(page).filter({ hasText: EXTERNAL_PAST })
    await expect(past).toHaveAttribute('data-status', 'past')
    await expect(past).toContainText('ჩატარებულია')
    await expect(page.getByText('რეგისტრაცია')).toHaveCount(0)
  })

  test('filters by type without calling every development item training', async ({ page }) => {
    await page.goto('/events?type=events')
    await expect(total(page)).toHaveText('მოიძებნა: 3') // congress, both-categories post, external notice
    await expect(
      page.locator('.vh-events-tabs').getByRole('link', { name: /^ყველა/ }),
    ).toContainText(String(TOTAL))
    await expect(page.locator('.vh-events-tabs a[aria-current="page"]')).toContainText(
      'ღონისძიებები',
    )
    await expect(cards(page).filter({ hasText: fixture.posts.fellowship.title })).toHaveCount(0)
    await page.goto('/events?type=development')
    await expect(total(page)).toHaveText(`მოიძებნა: ${3 + EXTRA}`)
    await expect(page.getByText('ტრენინგად')).toHaveCount(0)
  })

  test('keeps search and type in the address bar and survives a reload', async ({ page }) => {
    await page.goto('/events')
    await form(page).getByLabel('საძიებო სიტყვა').fill('Fellowship')
    await form(page).getByRole('button', { name: 'ძიება' }).click()
    await expect(page).toHaveURL(/[?&]q=Fellowship/)
    await expect(total(page)).toHaveText('მოიძებნა: 1')
    await page
      .locator('.vh-events-tabs')
      .getByRole('link', { name: /პროფესიული განვითარება/ })
      .click()
    await expect(page).toHaveURL(/type=development/)
    await expect(page).toHaveURL(/q=Fellowship/)
    await expect(form(page).getByLabel('საძიებო სიტყვა')).toHaveValue('Fellowship')
    await page.reload()
    await expect(total(page)).toHaveText('მოიძებნა: 1')
    await page.goto(`/events?q=${encodeURIComponent('სატესტო საერთაშორისო')}`)
    await expect(cards(page)).toHaveCount(1)
  })

  test('paginates, preserves filters and resolves out-of-range pages', async ({ page }) => {
    await page.goto('/events')
    await expect(page.getByText(`გვერდი 1 / 2`)).toBeVisible()
    await page.getByRole('link', { name: 'შემდეგი გვერდი' }).click()
    await expect(page).toHaveURL(/page=2/)
    await expect(cards(page)).toHaveCount(TOTAL - PAGE_SIZE)
    await expect(page.getByRole('link', { name: 'წინა გვერდი' })).toHaveAttribute('href', '/events')
    await page.goto('/events?page=99')
    await expect(page).toHaveURL(`${BASE}/events?page=2`)
    await page.goto('/events?q=Fellowship&page=5')
    await expect(page).toHaveURL(`${BASE}/events?q=Fellowship`)
    await page.goto('/events?type=development')
    const next = await page.getByRole('link', { name: 'შემდეგი გვერდი' }).getAttribute('href')
    expect(next).toContain('type=development')
    expect(next).toContain('page=2')
  })

  test('offers a date filter built only on valid structured dates', async ({ page }) => {
    await page.goto('/events')
    await expect(form(page).getByLabel('თარიღი')).toBeVisible()
    await page.goto('/events?when=upcoming')
    await expect(total(page)).toHaveText('მოიძებნა: 1')
    await page.goto('/events?when=past')
    await expect(total(page)).toHaveText('მოიძებნა: 1')
    await page.goto('/events?when=undated')
    await expect(total(page)).toHaveText(`მოიძებნა: ${TOTAL - 2}`)
    await page.goto('/events')
    await form(page).getByLabel('თარიღი').selectOption('past')
    await form(page).getByRole('button', { name: 'ფილტრის გამოყენება' }).click()
    await expect(page).toHaveURL(/when=past/)
  })

  test('uses safe links: internal for posts, new window with rel for external pages', async ({
    page,
    request,
  }) => {
    await page.goto('/events')
    const internal = cards(page).first().getByRole('link')
    await expect(internal).toHaveAttribute('href', `/posts/${fixture.posts.congress.slug}`)
    await expect(internal).not.toHaveAttribute('target', '_blank')
    expect((await request.get(`/posts/${fixture.posts.congress.slug}`)).status()).toBe(200)
    await page.goto('/events?page=2')
    const external = cards(page).filter({ hasText: EXTERNAL_PAST }).getByRole('link')
    await expect(external).toHaveAttribute('href', 'https://example.org/past-congress')
    await expect(external).toHaveAttribute('target', '_blank')
    const rel = (await external.getAttribute('rel')) ?? ''
    expect(rel).toContain('noopener')
    expect(rel).toContain('noreferrer')
  })

  test('shows an honest empty result with a way back', async ({ page }) => {
    await page.goto('/events?q=არარსებულიკვანძი123')
    await expect(total(page)).toHaveText('მოიძებნა: 0')
    await expect(page.getByText('შესაბამისი ჩანაწერი ვერ მოიძებნა.')).toBeVisible()
    await page.getByRole('link', { name: 'ყველა ჩანაწერის ნახვა' }).click()
    await expect(page).toHaveURL(`${BASE}/events`)
  })

  test('works from the keyboard with a single tab stop per card', async ({ page }) => {
    await page.goto('/events')
    await expect(page.locator('.vh-events-card-link')).toHaveCount(PAGE_SIZE)
    await form(page).getByLabel('საძიებო სიტყვა').focus()
    let reached = false
    for (let step = 0; step < 14 && !reached; step += 1) {
      await page.keyboard.press('Tab')
      reached = await page.evaluate(
        () => document.activeElement?.classList.contains('vh-events-card-link') ?? false,
      )
    }
    expect(reached).toBe(true)
    await expect(page.locator('.vh-events-card:has(a:focus-visible)')).toHaveCount(1)
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(new RegExp(`/posts/${fixture.posts.congress.slug}$`))
  })

  test('submits as a plain GET form that keeps the active type and all state in the URL', async ({
    page,
  }) => {
    await page.goto('/events?type=development&when=undated&q=Fellowship')
    await expect(form(page)).toHaveAttribute('method', 'get')
    await expect(form(page)).toHaveAttribute('action', '/events')
    await expect(form(page).locator('input[name="type"]')).toHaveValue('development')
    await expect(form(page).getByLabel('საძიებო სიტყვა')).toHaveValue('Fellowship')
    await expect(form(page).getByLabel('თარიღი')).toHaveValue('undated')
    await expect(total(page)).toHaveText('მოიძებნა: 1')
    // Clearing the filters returns to the bare address.
    await form(page).getByRole('link', { name: 'ფილტრების გასუფთავება' }).click()
    await expect(page).toHaveURL(`${BASE}/events`)
  })

  test('an admin session and a preview cookie never reveal drafts in the public list', async ({
    page,
  }) => {
    await login({ page, serverURL: BASE, user: testUser })
    const admin = await page.request.get('/api/posts?draft=true&limit=100&depth=0')
    expect(JSON.stringify(await admin.json())).toContain(fixture.posts.draft.title)
    await page.goto(
      `/next/preview?path=${encodeURIComponent('/events')}&previewSecret=${process.env.PREVIEW_SECRET}`,
    )
    const cookies = await page.context().cookies()
    expect(cookies.some((cookie) => cookie.name === '__prerender_bypass')).toBe(true)
    await page.goto('/events')
    expect(await page.content()).not.toContain(fixture.posts.draft.title)
    await expect(total(page)).toHaveText(`მოიძებნა: ${TOTAL}`)
  })

  for (const [width, columns] of [
    [390, 1],
    [768, 2],
    [1440, 3],
  ] as const) {
    test(`lays out cleanly at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/events')
      await expect(cards(page)).toHaveCount(PAGE_SIZE)
      const metrics = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        columns: getComputedStyle(
          document.querySelector('.vh-events-grid')!,
        ).gridTemplateColumns.split(' ').length,
      }))
      expect(metrics.overflow).toBeLessThanOrEqual(0)
      expect(metrics.columns).toBe(columns)
      await screenshot(page, `events-${width}`)
    })
  }

  test('shows the empty state when nothing has been published', async ({ page }) => {
    await cleanupEventsFixture(payload, fixture)
    await page.goto('/events')
    await expect(total(page)).toHaveText('მოიძებნა: 0')
    await expect(
      page.getByText(
        'ამ ეტაპზე გამოქვეყნებული ღონისძიებები ან პროფესიული განვითარების შესაძლებლობები არ არის.',
      ),
    ).toBeVisible()
    await screenshot(page, 'events-empty')
    fixture = await seedEventsFixture(payload) // keep afterAll symmetrical
  })
})
