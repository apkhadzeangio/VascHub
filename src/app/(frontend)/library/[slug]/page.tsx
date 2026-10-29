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
import { LibraryCard } from '@/Library/Card'
import { availablePDF } from '@/Library/pdf'
import { findPublicResource, libraryURL } from '@/Library/queries'
import { doiURL, officialURL, resourceLanguages, resourceURL } from '@/Library/options'
const loadResource = cache(async (slug: string) =>
  findPublicResource(await getPayload({ config }), slug),
)
type Args = { params: Promise<{ slug: string }> }
export default async function ResourcePage({ params }: Args) {
  const resource = await loadResource((await params).slug)
  if (!resource) notFound()
  const payload = await getPayload({ config })
  const pdf = await availablePDF(payload, resource)
  const source = officialURL(resource.officialSourceUrl)
  const doi = doiURL(resource.doi)
  const relatedIDs = resource.relatedResources?.map((r) => (typeof r === 'object' ? r.id : r)) || []
  const related = relatedIDs.length
    ? await payload.find({
        collection: 'library-resources',
        overrideAccess: false,
        draft: false,
        depth: 1,
        limit: 6,
        where: {
          and: [
            { id: { in: relatedIDs } },
            { id: { not_equals: resource.id } },
            { _status: { equals: 'published' } },
          ],
        },
      })
    : null
  const newer = resource.supersededBy
    ? await payload.findByID({
        collection: 'library-resources',
        id:
          typeof resource.supersededBy === 'object'
            ? resource.supersededBy.id
            : resource.supersededBy,
        overrideAccess: false,
        depth: 0,
        disableErrors: true,
      })
    : null
  const editionLabels = {
    'not-assessed':
      'მოგვიანებითი განახლება არ არის შეფასებული. გამოცემის წელი არ ადასტურებს, რომ დოკუმენტი უახლესია.',
    original: 'ორიგინალური გამოცემა',
    updated: 'განახლებული გამოცემა',
    superseded: 'არსებობს დადასტურებული ახალი გამოცემა',
  }
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
              {typeof resource.documentType === 'object' ? resource.documentType.title : ''}
            </p>
            <h1>{resource.title}</h1>
            {resource.originalTitle && <p lang="en">{resource.originalTitle}</p>}
            <p>
              {typeof resource.publisherOrganization === 'object'
                ? resource.publisherOrganization.title
                : ''}
            </p>
          </header>
          <div className="vh-library-detail-grid">
            <Card className="vh-library-body">
              <h2>რესურსის შესახებ</h2>
              <p className="vh-library-description">{resource.summary}</p>
              {resource.description && (
                <p className="vh-library-description">{resource.description}</p>
              )}
              <h2>კლინიკური მიმართულებები</h2>
              <div className="vh-library-topics">
                {resource.clinicalTopics?.map(
                  (t) =>
                    typeof t === 'object' && (
                      <Link key={t.id} href={libraryURL({ topic: t.slug || '' })}>
                        {t.title}
                      </Link>
                    ),
                )}
              </div>
              <h2>გამოცემა და განახლება</h2>
              <p>{editionLabels[resource.editionStatus]}</p>
              {resource.versionLabel && <p>{resource.versionLabel}</p>}
              {newer && (
                <p>
                  <Link className="vh-library-reset" href={resourceURL(newer)}>
                    ახალი გამოცემის ნახვა
                  </Link>
                </p>
              )}
              {officialURL(resource.updateEvidenceUrl) && (
                <p>
                  <a
                    className="vh-library-reset"
                    href={resource.updateEvidenceUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    განახლების დადასტურება<span className="sr-only"> — ახალ ჩანართში</span>
                  </a>
                </p>
              )}
              {resource.citationText && (
                <>
                  <h2>ბიბლიოგრაფიული ციტირება</h2>
                  <p className="vh-library-description">{resource.citationText}</p>
                </>
              )}
              {resource.searchKeywords && (
                <>
                  <h2>საკვანძო სიტყვები</h2>
                  <p>{resource.searchKeywords}</p>
                </>
              )}
              {resource.copyrightNotice && (
                <>
                  <h2>საავტორო უფლებები</h2>
                  <p>{resource.copyrightNotice}</p>
                </>
              )}
            </Card>
            <aside aria-label="რესურსის მონაცემები">
              <Card className="vh-library-body">
                <h2>ინფორმაცია</h2>
                <dl className="vh-library-metadata">
                  <div>
                    <dt>გამოცემის წელი</dt>
                    <dd>{resource.publicationYear}</dd>
                  </div>
                  {resource.publicationDate && (
                    <div>
                      <dt>გამოქვეყნების თარიღი</dt>
                      <dd>
                        <time dateTime={resource.publicationDate}>
                          {dateLabel(resource.publicationDate)}
                        </time>
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt>ენა</dt>
                    <dd>{resourceLanguages.find((l) => l.value === resource.language)?.label}</dd>
                  </div>
                  {resource.authors && (
                    <div>
                      <dt>ავტორები</dt>
                      <dd>{resource.authors}</dd>
                    </div>
                  )}
                  {resource.journal && (
                    <div>
                      <dt>ჟურნალი</dt>
                      <dd>{resource.journal}</dd>
                    </div>
                  )}
                  {resource.lastReviewedAt && (
                    <div>
                      <dt>მეტამონაცემების გადამოწმება</dt>
                      <dd>
                        <time dateTime={resource.lastReviewedAt}>
                          {dateLabel(resource.lastReviewedAt)}
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
                  {resource.pmid && (
                    <div>
                      <dt>PubMed</dt>
                      <dd>
                        <a
                          href={`https://pubmed.ncbi.nlm.nih.gov/${resource.pmid}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          PMID: {resource.pmid}
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
                  {source && (
                    <Button asChild variant="outline" size="lg">
                      <a href={source} target="_blank" rel="noopener noreferrer">
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
        {!!related?.docs.length && (
          <section aria-labelledby="related-resources">
            <h2 id="related-resources">დაკავშირებული რესურსები</h2>
            <div className="vh-resource-grid">
              {related.docs.map((r) => (
                <LibraryCard key={r.id} resource={r} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const r = await loadResource((await params).slug)
  if (!r) return { title: 'რესურსი ვერ მოიძებნა | VascHub', robots: { index: false } }
  const title = r.meta?.title || `${r.title} | VascHub`
  const description = r.meta?.description || r.summary.slice(0, 300)
  return {
    title,
    description,
    alternates: { canonical: resourceURL(r) },
    openGraph: {
      title,
      description,
      url: resourceURL(r),
      type: 'article',
      modifiedTime: r.updatedAt,
    },
  }
}
