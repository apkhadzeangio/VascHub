import Link from 'next/link'
import { ArrowRight, BookOpen } from 'lucide-react'
import { Card } from '@/components/ui/card'
import type { LibraryResource } from '@/payload-types'
import { resourceTypes, resourceURL } from './options'

export function LibraryCard({
  resource,
}: {
  resource: Pick<
    LibraryResource,
    'id' | 'title' | 'slug' | 'resourceType' | 'year' | 'description' | 'authors' | 'categories'
  >
}) {
  return (
    <Link
      href={resourceURL(resource)}
      className="vh-resource-link"
      aria-labelledby={`library-${resource.id}`}
    >
      <Card className="vh-resource-card" data-testid="library-card">
        <span className="vh-resource-icon">
          <BookOpen size={20} aria-hidden="true" />
        </span>
        <p className="vh-resource-kind">
          {resourceTypes.find((t) => t.value === resource.resourceType)?.label} · {resource.year}
        </p>
        <h3 id={`library-${resource.id}`}>{resource.title}</h3>
        <p className="vh-resource-description vh-library-summary">{resource.description}</p>
        <p className="vh-library-author">{resource.authors}</p>
        <div className="vh-library-tags">
          {resource.categories?.map(
            (c) => typeof c === 'object' && <span key={c.id}>{c.title}</span>,
          )}
        </div>
        <span className="vh-resource-action">
          რესურსის ნახვა <ArrowRight size={18} aria-hidden="true" />
        </span>
      </Card>
    </Link>
  )
}
