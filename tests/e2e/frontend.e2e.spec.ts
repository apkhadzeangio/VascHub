import { test, expect } from '@playwright/test'

test('should load the Georgian VascHub homepage', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(page).toHaveTitle(/VascHub/)
  await expect(page.locator('h1').first()).toHaveText('ცოდნა ყოველდღიური პრაქტიკისთვის.')
  await expect(page.locator('html')).toHaveAttribute('lang', 'ka')
  expect(errors).toEqual([])
})

test('should reject anonymous account creation and first registration', async ({ request }) => {
  const data = { email: 'unauthorized@vaschub.test', password: 'not-a-real-account-password-123' }
  for (const path of ['/api/users', '/api/users/first-register']) {
    const response = await request.post(path, { data })
    expect(response.status()).toBe(403)
  }
})
