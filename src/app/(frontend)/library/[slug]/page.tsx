import type { Metadata } from 'next'
import Link from 'next/link'
import { cache } from 'react'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ExternalLink, FileDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { dateLabel } from '@/Homepage/ResourceCard'
import { availablePDF } from '@/Library/pdf'
import { findPublicResource, libraryURL } from '@/Library/queries'
import {
  doiURL,
  officialURL,
  resourceLanguages,
  resourceTypes,
  resourceURL,
} from '@/Library/options'

const loadResource = cache(async (slug: string) =>
  findPublicResource(await getPayload({ config }), slug),
)
type Args = { params: Promise<{ slug: string }> }

export default async function ResourcePage({ params }: Args) {
  const resource = await loadResource((await params).slug)
  if (!resource) notFound()
  const pdf = await availablePDF(await getPayload({ config }), resource)
  const source = officialURL(resource.sourceUrl)
  const doi = doiURL(resource.doi)
  return (
    <main className="vh-theme vh-library" tabIndex={-1}>
      <div className="vh-container">
        <nav aria-label="გვერდის მდებარეობა" className="vh-library-breadcrumb">
          <Link href="/">მთავარი</Link>
          <span aria-hidden="true">/</span>
          <Link href="/library">ბიბლიოთეკა</Link>
        </nav>
        <article className="vh-library-detail">
          <header className="vh-library-intro">
            <p className="vh-eyebrow">
              {resourceTypes.find((t) => t.value === resource.resourceType)?.label}
            </p>
            <h1>{resource.title}</h1>
            <p>{resource.authors}</p>
          </header>
          <div className="vh-library-detail-grid">
            <Card className="vh-library-body">
              <h2>რესურსის შესახებ</h2>
              <p className="vh-library-description">{resource.description}</p>
              {!!resource.categories?.length && (
                <>
                  <h2>კლინიკური თემები</h2>
                  <div className="vh-library-topics">
                    {resource.categories.map(
                      (c) =>
                        typeof c === 'object' && (
                          <Link key={c.id} href={libraryURL({ category: c.slug ?? '' })}>
                            {c.title}
                          </Link>
                        ),
                    )}
                  </div>
                </>
              )}
              {resource.keywords && (
                <>
                  <h2>საკვანძო სიტყვები</h2>
                  <p>{resource.keywords}</p>
                </>
              )}
            </Card>
            <aside aria-label="რესურსის მონაცემები">
              <Card className="vh-library-body">
                <h2>ინფორმაცია</h2>
                <dl className="vh-library-metadata">
                  <div>
                    <dt>გამოცემის წელი</dt>
                    <dd>{resource.year}</dd>
                  </div>
                  {resource.version && (
                    <div>
                      <dt>ვერსია</dt>
                      <dd>{resource.version}</dd>
                    </div>
                  )}
                  <div>
                    <dt>ენა</dt>
                    <dd>{resourceLanguages.find((l) => l.value === resource.language)?.label}</dd>
                  </div>
                  {resource.resourceUpdatedAt && (
                    <div>
                      <dt>წყაროს განახლება</dt>
                      <dd>
                        <time dateTime={resource.resourceUpdatedAt}>
                          {dateLabel(resource.resourceUpdatedAt)}
                        </time>
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt>ჩანაწერის განახლება</dt>
                    <dd>
                      <time dateTime={resource.updatedAt}>{dateLabel(resource.updatedAt)}</time>
                    </dd>
                  </div>
                  {doi && (
                    <div>
                      <dt>DOI</dt>
                      <dd>
                        <a href={doi} target="_blank" rel="noopener noreferrer">
                          {resource.doi}
                          <span className="sr-only"> — ახალ ჩანართში</span>
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
                <div className="vh-library-source-actions">
                  {pdf && (
                    <Button asChild size="lg">
                      <a
                        href={`${resourceURL(resource)}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FileDown size={18} aria-hidden="true" />
                        PDF-ის ჩამოტვირთვა<span className="sr-only"> — ახალ ჩანართში</span>
                      </a>
                    </Button>
                  )}
                  {(source || doi) && (
                    <Button asChild variant="outline" size="lg">
                      <a href={source || doi} target="_blank" rel="noopener noreferrer">
                        ოფიციალური წყარო
                        <ExternalLink size={18} aria-hidden="true" />
                        <span className="sr-only"> — ახალ ჩანართში</span>
                      </a>
                    </Button>
                  )}
                </div>
              </Card>
            </aside>
          </div>
        </article>
      </div>
    </main>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const resource = await loadResource((await params).slug)
  if (!resource) return { title: 'რესურსი ვერ მოიძებნა | VascHub', robots: { index: false } }
  const title = resource.meta?.title || `${resource.title} | VascHub`
  const description = resource.meta?.description || resource.description.slice(0, 300)
  return {
    title,
    description,
    alternates: { canonical: resourceURL(resource) },
    openGraph: {
      title,
      description,
      url: resourceURL(resource),
      type: 'article',
      modifiedTime: resource.updatedAt,
    },
  }
}
