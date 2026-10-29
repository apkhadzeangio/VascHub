import Link from 'next/link'
import { ArrowRight, BookOpen } from 'lucide-react'
import { Card } from '@/components/ui/card'
import type { LibraryResource } from '@/payload-types'
import { resourceLanguages, resourceURL } from './options'

export function LibraryCard({
  resource,
}: {
  resource: Pick<
    LibraryResource,
    | 'id'
    | 'title'
    | 'slug'
    | 'summary'
    | 'documentType'
    | 'publicationYear'
    | 'publisherOrganization'
    | 'clinicalTopics'
    | 'language'
  >
}) {
  const type = resource.documentType
  const organization = resource.publisherOrganization
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
          {typeof type === 'object' ? type.title : ''} · {resource.publicationYear} ·{' '}
          {resourceLanguages.find((l) => l.value === resource.language)?.label}
        </p>
        <h3 id={`library-${resource.id}`}>{resource.title}</h3>
        <p className="vh-resource-description vh-library-summary">{resource.summary}</p>
        <p className="vh-library-author">
          {typeof organization === 'object' ? organization.abbreviation || organization.title : ''}
        </p>
        <div className="vh-library-tags">
          {resource.clinicalTopics?.map(
            (t) => typeof t === 'object' && <span key={t.id}>{t.title}</span>,
          )}
        </div>
        <span className="vh-resource-action">
          დეტალურად <ArrowRight size={18} aria-hidden="true" />
        </span>
      </Card>
    </Link>
  )
}
