import { expect, type Page } from '@playwright/test'

/** Wait for the actual publish response before leaving an asynchronous CMS form. */
export async function publishDocument(page: Page, collection: string, id: number) {
  const result = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return (
      url.pathname === `/api/${collection}/${id}` &&
      response.request().method() === 'PATCH' &&
      url.searchParams.get('autosave') !== 'true' &&
      url.searchParams.get('draft') !== 'true'
    )
  })
  await page.getByRole('button', { name: /^Publish( changes)?$/ }).click()
  const response = await result
  expect(response.status()).toBe(200)
  expect((await response.json()).doc._status).toBe('published')
}
