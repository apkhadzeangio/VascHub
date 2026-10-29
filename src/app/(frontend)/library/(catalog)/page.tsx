import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/Homepage/Page'
import { LibraryCard } from '@/Library/Card'
import { LibraryFilterForm } from '@/Library/Filters'
import { libraryURL, parseLibraryFilters, queryLibrary } from '@/Library/queries'

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const filters = parseLibraryFilters(await searchParams)
  const payload = await getPayload({ config })
  const [resources, topics, types, organizations] = await Promise.all([
    queryLibrary(payload, filters),
    payload.find({
      collection: 'library-topics',
      overrideAccess: false,
      depth: 0,
      limit: 500,
      sort: 'title',
    }),
    payload.find({
      collection: 'library-document-types',
      overrideAccess: false,
      depth: 0,
      limit: 500,
      sort: 'title',
    }),
    payload.find({
      collection: 'library-organizations',
      overrideAccess: false,
      depth: 0,
      limit: 500,
      sort: 'title',
    }),
  ])
  return (
    <main className="vh-theme vh-library" tabIndex={-1}>
      <div className="vh-container">
        <nav aria-label="გვერდის მდებარეობა" className="vh-library-breadcrumb">
          <Link href="/">მთავარი</Link>
          <span aria-hidden="true">/</span>
          <span>ბიბლიოთეკა</span>
        </nav>
        <header className="vh-library-intro">
          <p className="vh-eyebrow">კლინიკური ცოდნა ერთ სივრცეში</p>
          <h1>კლინიკური ბიბლიოთეკა</h1>
          <p>გაიდლაინები, სამეცნიერო პუბლიკაციები და პროფესიული სასწავლო მასალები.</p>
        </header>
        <LibraryFilterForm
          filters={filters}
          topics={topics.docs}
          types={types.docs}
          organizations={organizations.docs}
        />
        <nav aria-label="რესურსის ტიპების სწრაფი არჩევანი" className="vh-library-topics">
          {types.docs.map((t) => (
            <Link
              key={t.id}
              href={libraryURL({ ...filters, type: t.slug || '', page: 1 })}
              aria-current={filters.type === t.slug ? 'page' : undefined}
            >
              {t.title}
            </Link>
          ))}
        </nav>
        <nav aria-label="კლინიკური თემები" className="vh-library-topics">
          <Link
            href={libraryURL({ ...filters, topic: '', page: 1 })}
            aria-current={!filters.topic ? 'page' : undefined}
          >
            ყველა თემა
          </Link>
          {topics.docs.map((c) => (
            <Link
              key={c.id}
              href={libraryURL({ ...filters, topic: c.slug ?? '', page: 1 })}
              aria-current={filters.topic === c.slug ? 'page' : undefined}
            >
              {c.title}
            </Link>
          ))}
        </nav>
        <section aria-labelledby="library-results">
          <div className="vh-section-heading">
            <h2 id="library-results">რესურსები</h2>
            <p role="status" className="vh-library-count">
              მოიძებნა: {resources.totalDocs}
            </p>
          </div>
          {resources.docs.length ? (
            <div className="vh-resource-grid">
              {resources.docs.map((resource) => (
                <LibraryCard key={resource.id} resource={resource} />
              ))}
            </div>
          ) : (
            <EmptyState>
              {filters.q ||
              filters.topic ||
              filters.type ||
              filters.organization ||
              filters.language ||
              filters.year ||
              filters.page > 1
                ? 'შესაბამისი რესურსი ვერ მოიძებნა. შეცვალეთ საძიებო სიტყვა ან გაასუფთავეთ ფილტრები.'
                : 'ბიბლიოთეკაში გამოქვეყნებული რესურსები ჯერ არ არის.'}
              <br />
              <Link className="vh-library-reset" href="/library">
                ყველა რესურსის ნახვა
              </Link>
            </EmptyState>
          )}
          {(resources.hasPrevPage || resources.hasNextPage) && (
            <nav aria-label="ბიბლიოთეკის გვერდები" className="vh-search-pagination">
              {resources.hasPrevPage && (
                <Button asChild variant="outline" size="lg">
                  <Link
                    href={libraryURL({
                      ...filters,
                      page: Math.min(filters.page - 1, resources.totalPages || 1),
                    })}
                  >
                    წინა გვერდი
                  </Link>
                </Button>
              )}
              <span>
                გვერდი {filters.page} / {resources.totalPages}
              </span>
              {resources.hasNextPage && (
                <Button asChild variant="outline" size="lg">
                  <Link href={libraryURL({ ...filters, page: resources.nextPage! })}>
                    შემდეგი გვერდი
                  </Link>
                </Button>
              )}
            </nav>
          )}
        </section>
      </div>
    </main>
  )
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}): Promise<Metadata> {
  const params = await searchParams
  return {
    title: 'კლინიკური ბიბლიოთეკა | VascHub',
    description: 'სისხლძარღვთა ქირურგიის გაიდლაინები, პუბლიკაციები და სასწავლო რესურსები.',
    alternates: { canonical: '/library' },
    robots: Object.keys(params).length ? { index: false, follow: true } : undefined,
  }
}
