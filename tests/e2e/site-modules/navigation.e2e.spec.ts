import { test, expect } from '@playwright/test'

for (const width of [390, 1440]) {
  test(`module navigation reaches real catalogues at ${width}px`, async ({ page, request }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/')
    await expect(page.getByRole('link', { name: 'ყველა ღონისძიება', exact: true })).toHaveAttribute(
      'href',
      '/events',
    )
    if (width === 390) await page.getByRole('button', { name: 'მენიუს გახსნა' }).click()
    const nav = page.locator(width === 390 ? 'dialog .vh-nav' : '.vh-desktop-nav')
    // The mobile menu's named navigation is also available when its wrapper class changes.
    const scope =
      width === 390 ? page.getByRole('dialog', { name: 'VascHub — მენიუ', exact: true }) : nav
    await expect(scope.getByRole('link', { name: 'ღონისძიებები', exact: true })).toHaveAttribute(
      'href',
      '/events',
    )
    await scope.getByRole('link', { name: 'პროფესიული ქსელი', exact: true }).click()
    await expect(page).toHaveURL(/\/specialists$/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.getByRole('link', { name: 'სისხლძარღვთა ცენტრები', exact: true }).click()
    await expect(page).toHaveURL(/\/centres$/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const sitemap = await request.get('/site-modules-sitemap.xml')
    expect(sitemap.status()).toBe(200)
    const xml = await sitemap.text()
    for (const path of ['/events', '/specialists', '/centres'])
      expect(xml).toContain(`${path}</loc>`)
  })
}
