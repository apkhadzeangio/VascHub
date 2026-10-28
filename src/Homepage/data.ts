import { cache } from 'react'
import { draftMode } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Post } from '@/payload-types'
import type { ResourcePost } from './ResourceCard'
import { queryPublishedPosts } from '@/search/queryPublishedPosts'

export const getHomepagePage = cache(async () => {
  const payload = await getPayload({ config })
  const { isEnabled: draft } = await draftMode()
  const pages = await payload.find({
    collection: 'pages',
    depth: 0,
    limit: 1,
    pagination: false,
    draft,
    overrideAccess: draft,
    where: { slug: { equals: 'home' } },
  })
  return pages.docs[0] ?? null
})

export function postID(value: number | Post | null | undefined) {
  return typeof value === 'number' ? value : value?.id
}

export async function getHomepageData() {
  const page = await getHomepagePage()
  const payload = await getPayload({ config })
  const home = page?.homepage
  const resourcesIDs =
    home?.resources?.map(postID).filter((id): id is number => id !== undefined) ?? []
  const newsIDs = home?.newsPosts?.map(postID).filter((id): id is number => id !== undefined) ?? []
  const academyID = postID(home?.academy?.post)
  const selectedIDs = [...new Set([...resourcesIDs, ...newsIDs, ...(academyID ? [academyID] : [])])]
  const [latest, selected] = await Promise.all([
    queryPublishedPosts(payload, { limit: 3 }),
    selectedIDs.length ? queryPublishedPosts(payload, { ids: selectedIDs, limit: 6 }) : null,
  ])
  const posts = selected?.docs ?? []
  const inOrder = (ids: number[]) =>
    ids.map((id) => posts.find((p) => p.id === id)).filter((p): p is ResourcePost => Boolean(p))
  return {
    page,
    home,
    resources: resourcesIDs.length ? inOrder(resourcesIDs) : latest.docs,
    news: inOrder(newsIDs),
    academyPost: posts.find((p) => p.id === academyID),
  }
}
