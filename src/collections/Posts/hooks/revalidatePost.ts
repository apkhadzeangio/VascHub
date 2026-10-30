import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import type { Post } from '../../../payload-types'

export const revalidatePost: CollectionAfterChangeHook<Post> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    if (doc._status === 'published') {
      const path = `/posts/${doc.slug}`

      payload.logger.info(`Revalidating post at path: ${path}`)

      revalidatePath(path)
      revalidateTag(`posts_${doc.slug}`, { expire: 0 })
      revalidateTag('posts-sitemap', 'max')
    }

    // If the post was previously published, we need to revalidate the old path
    if (
      previousDoc?._status === 'published' &&
      (doc._status !== 'published' || previousDoc.slug !== doc.slug)
    ) {
      const oldPath = `/posts/${previousDoc.slug}`

      payload.logger.info(`Revalidating old post at path: ${oldPath}`)

      revalidatePath(oldPath)
      revalidateTag(`posts_${previousDoc.slug}`, { expire: 0 })
      revalidateTag('posts-sitemap', 'max')
    }

    if (doc._status === 'published' || previousDoc?._status === 'published') {
      revalidatePath('/')
      revalidatePath('/posts', 'layout')
      revalidatePath('/search')
      // Header/footer links can contain populated Post references.
      revalidateTag('global_header', { expire: 0 })
      revalidateTag('global_footer', { expire: 0 })
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Post> = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    const path = `/posts/${doc?.slug}`

    revalidatePath(path)
    revalidateTag(`posts_${doc.slug}`, { expire: 0 })
    revalidateTag('posts-sitemap', 'max')
    revalidatePath('/')
    revalidatePath('/posts', 'layout')
    revalidatePath('/search')
    revalidateTag('global_header', { expire: 0 })
    revalidateTag('global_footer', { expire: 0 })
  }

  return doc
}
