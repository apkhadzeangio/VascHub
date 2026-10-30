import { test, expect, type APIRequestContext } from '@playwright/test'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import type { Header, Footer } from '@/payload-types'
import { demoContent, assertTestDatabase } from '../../helpers/homepageFixture'
import { mkdir } from 'node:fs/promises'

let payload: Payload
let editorID: number
let token: string
let homeID: number
let postID: number
let oldHeader: Header
let oldFooter: Footer
const redirectIDs: number[] = []
const slug = `combined-${Date.now()}`
const editor = { email: `${slug}@vaschub.test`, password: 'isolated-integration-test-password-123' }

async function write(
  request: APIRequestContext,
  method: 'post' | 'patch' | 'delete',
  url: string,
  data?: unknown,
) {
  const response = await request[method](url, { headers: { Authorization: `JWT ${token}` }, data })
  expect(response.ok(), `${method} ${url}: ${response.status()}`).toBeTruthy()
  return response.json()
}

test.describe.serial('Combined UI and CMS lifecycle on an isolated Next server', () => {
  test.beforeAll(async ({ request, baseURL }) => {
    assertTestDatabase()
    if (
      !baseURL ||
      !['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname) ||
      !['localhost', '127.0.0.1'].includes(new URL(process.env.DATABASE_URL!).hostname)
    )
      throw new Error('Integration HTTP fixtures require loopback app and test database.')
    payload = await getPayload({ config, key: 'integration-http' })
    oldHeader = await payload.findGlobal({ slug: 'header', depth: 0 })
    oldFooter = await payload.findGlobal({ slug: 'footer', depth: 0 })
    editorID = (
      await payload.create({ collection: 'users', context: { bootstrapAdmin: true }, data: editor })
    ).id
    const login = await request.post('/api/users/login', { data: editor })
    expect(login.ok()).toBeTruthy()
    token = (await login.json()).token
    postID = (
      await write(request, 'post', '/api/posts', {
        title: 'სატესტო სტატია — ინტეგრაციის შემოწმება',
        slug,
        content: demoContent,
        _status: 'published',
      })
    ).doc.id
    homeID = (
      await write(request, 'post', '/api/pages', {
        title: 'Integration home',
        slug: 'home',
        hero: { type: 'none' },
        layout: [{ blockType: 'content', columns: [{ size: 'full' }] }],
        _status: 'published',
        homepage: { heading: 'სატესტო მთავარი გვერდი', resources: [postID] },
      })
    ).doc.id
    await write(request, 'post', '/api/globals/header', {
      navItems: [
        {
          link: {
            type: 'reference',
            label: 'ინტეგრაციის სტატია',
            reference: { relationTo: 'posts', value: postID },
          },
        },
      ],
    })
    for (const [from, relationTo, value] of [
      [`/legacy-${slug}`, 'posts', postID],
      [`/legacy-home-${slug}`, 'pages', homeID],
    ] as const) {
      redirectIDs.push(
        (
          await write(request, 'post', '/api/redirects', {
            from,
            to: { type: 'reference', reference: { relationTo, value } },
          })
        ).doc.id,
      )
    }
  })

  test.afterAll(async ({ request }) => {
    if (!payload) return
    try {
      if (token && oldHeader)
        await write(request, 'post', '/api/globals/header', { navItems: oldHeader.navItems })
      if (token && oldFooter)
        await write(request, 'post', '/api/globals/footer', { navItems: oldFooter.navItems })
      for (const id of redirectIDs) await write(request, 'delete', `/api/redirects/${id}`)
      if (homeID) await write(request, 'delete', `/api/pages/${homeID}`)
      if (postID) await write(request, 'delete', `/api/posts/${postID}`)
      if (editorID) await payload.delete({ collection: 'users', id: editorID })
    } finally {
      await payload.destroy()
    }
  })

  test('resolves real Post/home redirect references and emits the correct canonical URL', async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({ baseURL })
    try {
      for (const [from, destination] of [
        [`/legacy-${slug}`, `/posts/${slug}`],
        [`/legacy-home-${slug}`, '/'],
      ]) {
        await expect
          .poll(async () => {
            const response = await context.request.get(from, { maxRedirects: 0 })
            return [response.status(), response.headers().location]
          })
          .toEqual([307, destination])
      }
      const page = await context.newPage()
      await page.goto(`/posts/${slug}`)
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        `${baseURL}/posts/${slug}`,
      )
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
        'content',
        `${baseURL}/posts/${slug}`,
      )
    } finally {
      await context.close()
    }
  })

  test('refreshes navigation, redirects and public visibility after HTTP edits', async ({
    request,
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({ baseURL })
    try {
      const page = await context.newPage()
      await page.goto('/')
      await expect(page.locator('.vh-desktop-nav a[href="/posts/' + slug + '"]')).toHaveCount(1)
      await write(request, 'patch', `/api/posts/${postID}`, {
        slug: `${slug}-renamed`,
        _status: 'published',
      })
      await page.reload()
      await expect(page.locator(`.vh-desktop-nav a[href="/posts/${slug}-renamed"]`)).toHaveCount(1)
      const redirected = await context.request.get(`/legacy-${slug}`, { maxRedirects: 0 })
      expect(redirected.headers().location).toBe(`/posts/${slug}-renamed`)
      await page.setViewportSize({ width: 390, height: 844 })
      await mkdir('test-results/homepage/integration', { recursive: true })
      await page.screenshot({
        path: 'test-results/homepage/integration/home-390.png',
        fullPage: true,
      })
      await write(request, 'patch', `/api/posts/${postID}`, { _status: 'draft' })
      await page.reload()
      await expect(page.locator(`[href="/posts/${slug}-renamed"]`)).toHaveCount(0)
      expect((await context.request.get(`/posts/${slug}-renamed`)).status()).toBe(404)
      expect((await context.request.get(`/legacy-${slug}`)).status()).toBe(404)
      await page.goto(`/search?q=${slug}`)
      await expect(page.getByRole('status')).toContainText('მოიძებნა: 0')
    } finally {
      await context.close()
    }
  })

  test('keeps home Draft private and verifies authenticated Preview then exit', async ({
    request,
    browser,
    baseURL,
  }) => {
    // Remove the now-unpublished relationship before saving a new home version.
    await write(request, 'patch', `/api/pages/${homeID}?draft=true`, {
      _status: 'draft',
      homepage: { resources: [], heading: 'პირადი სატესტო წინასახედი' },
    })
    const guest = await browser.newContext({ baseURL })
    const admin = await browser.newContext({ baseURL })
    try {
      const publicPage = await guest.newPage()
      await publicPage.goto('/')
      await expect(publicPage.getByRole('heading', { level: 1 })).toHaveText(
        'სატესტო მთავარი გვერდი',
      )
      const previewURL = `/next/preview?${new URLSearchParams({ path: '/', previewSecret: process.env.PREVIEW_SECRET! })}`
      expect((await guest.request.get(previewURL, { maxRedirects: 0 })).status()).toBe(403)
      expect((await admin.request.post('/api/users/login', { data: editor })).ok()).toBeTruthy()
      const previewPage = await admin.newPage()
      await previewPage.goto(previewURL)
      await expect(previewPage.getByRole('heading', { level: 1 })).toHaveText(
        'პირადი სატესტო წინასახედი',
      )
      await previewPage.goto('/next/exit-preview')
      await expect(previewPage.getByRole('heading', { level: 1 })).toHaveText(
        'სატესტო მთავარი გვერდი',
      )
    } finally {
      await guest.close()
      await admin.close()
    }
  })

  test('renders a Georgian Posts landmark and rejects invalid archive pages', async ({
    page,
    request,
  }) => {
    await page.goto('/posts')
    await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveText(
      'სტატიები და სიახლეები',
    )
    await expect(page.getByRole('main')).not.toContainText('Search produced no results.')
    expect((await request.get('/posts/page/0')).status()).toBe(404)
    expect((await request.get('/posts/page/99999')).status()).toBe(404)
  })
})
