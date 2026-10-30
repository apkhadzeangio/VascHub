import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  revalidatePost,
  revalidateDelete as deletePost,
} from '@/collections/Posts/hooks/revalidatePost'
import {
  revalidatePage,
  revalidateDelete as deletePage,
} from '@/collections/Pages/hooks/revalidatePage'
import { revalidatePath, revalidateTag } from 'next/cache'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }))

const cases = [
  {
    collection: 'posts',
    change: revalidatePost,
    remove: deletePost,
    path: (slug: string) => `/posts/${slug}`,
  },
  {
    collection: 'pages',
    change: revalidatePage,
    remove: deletePage,
    path: (slug: string) => (slug === 'home' ? '/' : `/${slug}`),
  },
] as const

beforeEach(() => vi.clearAllMocks())

describe.each(cases)(
  '$collection public cache invalidation',
  ({ collection, change, remove, path }) => {
    async function update(
      status: string,
      previousStatus: string,
      slug = 'new',
      previousSlug = 'old',
      disabled = false,
    ) {
      return change({
        doc: { slug, _status: status },
        previousDoc: { slug: previousSlug, _status: previousStatus },
        req: { payload: { logger: { info: vi.fn() } }, context: { disableRevalidate: disabled } },
      } as unknown as Parameters<typeof revalidatePost>[0] & Parameters<typeof revalidatePage>[0])
    }

    it('expires both old and new addresses and document tags when a published slug changes', async () => {
      await update('published', 'published')
      expect(revalidatePath).toHaveBeenCalledWith(path('old'))
      expect(revalidatePath).toHaveBeenCalledWith(path('new'))
      expect(revalidateTag).toHaveBeenCalledWith(`${collection}_old`, { expire: 0 })
      expect(revalidateTag).toHaveBeenCalledWith(`${collection}_new`, { expire: 0 })
      expect(revalidateTag).toHaveBeenCalledWith('global_header', { expire: 0 })
      expect(revalidateTag).toHaveBeenCalledWith('global_footer', { expire: 0 })
    })

    it('expires the public document immediately on unpublish', async () => {
      await update('draft', 'published', 'old', 'old')
      expect(revalidatePath).toHaveBeenCalledWith(path('old'))
      expect(revalidateTag).toHaveBeenCalledWith(`${collection}_old`, { expire: 0 })
      expect(revalidateTag).toHaveBeenCalledWith('global_header', { expire: 0 })
    })

    it('expires a cached lookup when the document is deleted', async () => {
      await remove({
        doc: { slug: 'old', _status: 'published' },
        req: { context: {} },
      } as unknown as Parameters<typeof deletePost>[0] & Parameters<typeof deletePage>[0])
      expect(revalidatePath).toHaveBeenCalledWith(path('old'))
      expect(revalidateTag).toHaveBeenCalledWith(`${collection}_old`, { expire: 0 })
    })

    it('does not invalidate public content for a new draft autosave', async () => {
      await update('draft', 'draft')
      expect(revalidatePath).not.toHaveBeenCalled()
      expect(revalidateTag).not.toHaveBeenCalled()
    })

    it('honors the existing fixture disableRevalidate context', async () => {
      await update('published', 'published', 'new', 'old', true)
      expect(revalidatePath).not.toHaveBeenCalled()
      expect(revalidateTag).not.toHaveBeenCalled()
    })
  },
)

it('invalidates homepage, post listings, pagination and search after a published post changes', async () => {
  await revalidatePost({
    doc: { slug: 'new', _status: 'published' },
    previousDoc: { slug: 'new', _status: 'published' },
    req: { payload: { logger: { info: vi.fn() } }, context: {} },
  } as unknown as Parameters<typeof revalidatePost>[0])
  expect(revalidatePath).toHaveBeenCalledWith('/')
  expect(revalidatePath).toHaveBeenCalledWith('/posts', 'layout')
  expect(revalidatePath).toHaveBeenCalledWith('/search')
})
