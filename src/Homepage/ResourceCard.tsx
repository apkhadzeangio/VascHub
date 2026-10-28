import React from 'react'
import Link from 'next/link'
import { ArrowRight, FileText } from 'lucide-react'
import type { Post } from '@/payload-types'
import { Card } from '@/components/ui/card'

export type ResourcePost = Pick<
  Post,
  'id' | 'title' | 'slug' | 'meta' | 'categories' | 'updatedAt' | 'publishedAt'
>

export function postURL(post: Pick<Post, 'slug'>) {
  return `/posts/${encodeURIComponent(post.slug ?? '')}`
}
export function dateLabel(date: string) {
  return new Intl.DateTimeFormat('ka-GE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Tbilisi',
  }).format(new Date(date))
}
export function ResourceCard({ post }: { post: ResourcePost }) {
  const category = post.categories?.find((c) => typeof c === 'object')
  return (
    <Link href={postURL(post)} className="vh-resource-link" aria-labelledby={`resource-${post.id}`}>
      <Card className="vh-resource-card" data-testid="resource-card">
        <span className="vh-resource-icon">
          <FileText size={20} aria-hidden="true" />
        </span>
        <p className="vh-resource-kind">
          {category && typeof category === 'object' ? category.title : 'გამოქვეყნებული მასალა'}
        </p>
        <h3 id={`resource-${post.id}`}>{post.title}</h3>
        <p className="vh-resource-description">
          {post.meta?.description || 'გაეცანი გამოქვეყნებულ მასალას.'}
        </p>
        <time dateTime={post.updatedAt}>განახლდა: {dateLabel(post.updatedAt)}</time>
        <span className="vh-resource-action">
          რესურსის ნახვა
          <ArrowRight size={18} aria-hidden="true" />
        </span>
      </Card>
    </Link>
  )
}
