import type { Metadata } from 'next'
import React from 'react'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Search } from '@/search/Component'
import { queryPublishedPosts } from '@/search/queryPublishedPosts'
import { ResourceCard } from '@/Homepage/ResourceCard'
import { EmptyState } from '@/Homepage/Page'
import { Button } from '@/components/ui/button'

type Args = { searchParams: Promise<{ q?: string | string[]; page?: string | string[] }> }
export default async function SearchPage({ searchParams }: Args) {
  const params = await searchParams
  const query = (typeof params.q === 'string' ? params.q : '').trim().slice(0, 160)
  const page = Math.max(
    1,
    Math.min(10000, Number.parseInt(typeof params.page === 'string' ? params.page : '1', 10) || 1),
  )
  const payload = await getPayload({ config })
  const posts = await queryPublishedPosts(payload, { query, page })
  const pageURL = (n: number) => `/search?${new URLSearchParams({ q: query, page: String(n) })}`
  return (
    <main className="vh-theme vh-search-page">
      <div className="vh-container">
        <h1>{query ? 'ძიების შედეგები' : 'სტატიების ძიება'}</h1>
        <p>ძიება გამოქვეყნებული სტატიების სათაურებში, აღწერებსა და კატეგორიებში.</p>
        <Search query={query} />
        <p className="vh-search-count" role="status">
          {query ? `„${query}“ — ` : ''}მოიძებნა: {posts.totalDocs}
        </p>
        {posts.docs.length ? (
          <div className="vh-resource-grid">
            {posts.docs.map((post) => (
              <ResourceCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <EmptyState>
            {query
              ? 'შესაბამისი გამოქვეყნებული მასალა ვერ მოიძებნა. სცადე სხვა სიტყვა.'
              : 'გამოქვეყნებული სტატიები ჯერ არ არის.'}
          </EmptyState>
        )}
        {(posts.hasPrevPage || posts.hasNextPage) && (
          <nav aria-label="ძიების გვერდები" className="vh-search-pagination">
            {posts.hasPrevPage && (
              <Button asChild variant="outline" size="lg">
                <Link href={pageURL(posts.prevPage!)}>წინა გვერდი</Link>
              </Button>
            )}
            <span>
              {page} / {posts.totalPages}
            </span>
            {posts.hasNextPage && (
              <Button asChild variant="outline" size="lg">
                <Link href={pageURL(posts.nextPage!)}>შემდეგი გვერდი</Link>
              </Button>
            )}
          </nav>
        )}
      </div>
    </main>
  )
}
export const metadata: Metadata = { title: 'სტატიების ძიება | VascHub' }
