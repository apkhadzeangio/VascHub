import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/Homepage/Page'
import { EventCard } from '@/components/events/EventCard'
import { EventFilterForm } from '@/components/events/EventFilterForm'
import { applyFilters, eventTypes, eventsURL, parseEventFilters } from '@/Events/filters'
import { loadEventItems } from '@/Events/queries'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function EventsPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = parseEventFilters(await searchParams)
  const payload = await getPayload({ config })
  const all = await loadEventItems(payload)
  const results = applyFilters(all, filters)

  // An out-of-range page number resolves to the nearest real page instead of an empty screen.
  if (filters.page !== results.page) redirect(eventsURL({ ...filters, page: results.page }))

  const filtered = Boolean(filters.q || filters.type || filters.when)
  const tabs = [
    { value: '' as const, label: 'ყველა', count: results.counts.all },
    ...eventTypes.map((t) => ({ value: t.value, label: t.label, count: results.counts[t.value] })),
  ]

  return (
    <main className="vh-theme vh-events" tabIndex={-1}>
      <div className="vh-container">
        <nav aria-label="გვერდის მდებარეობა" className="vh-events-breadcrumb">
          <Link href="/">მთავარი</Link>
          <span aria-hidden="true">/</span>
          <span>ღონისძიებები და პროფესიული განვითარება</span>
        </nav>
        <header className="vh-events-intro">
          <p className="vh-eyebrow">პროფესიული შესაძლებლობები</p>
          <h1>ღონისძიებები და პროფესიული განვითარება</h1>
          <p>
            პროფესიული ღონისძიებები, ტრენინგები და განვითარების სხვა შესაძლებლობები — ერთ სივრცეში.
          </p>
          <p className="vh-events-note">
            თარიღი და ადგილი ნაჩვენებია მხოლოდ მაშინ, როცა ისინი წყაროში დადასტურებულია.
          </p>
        </header>
        <EventFilterForm filters={filters} showWhen={results.hasDatedItems} />
        <nav aria-label="ტიპის მიხედვით ფილტრი" className="vh-events-tabs">
          {tabs.map((tab) => (
            <Link
              key={tab.value || 'all'}
              href={eventsURL({ ...filters, type: tab.value, page: 1 })}
              aria-current={filters.type === tab.value ? 'page' : undefined}
            >
              {tab.label} <span className="vh-events-count">{tab.count}</span>
            </Link>
          ))}
        </nav>
        <section aria-labelledby="events-results">
          <div className="vh-events-results-heading">
            <h2 id="events-results">ჩანაწერები</h2>
            <p role="status" className="vh-events-total" data-testid="events-total">
              მოიძებნა: {results.total}
            </p>
          </div>
          {results.items.length ? (
            <ul className="vh-events-grid">
              {results.items.map((item) => (
                <li key={item.key}>
                  <EventCard item={item} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState>
              {filtered
                ? 'შესაბამისი ჩანაწერი ვერ მოიძებნა. შეცვალეთ საძიებო სიტყვა ან გაასუფთავეთ ფილტრები.'
                : 'ამ ეტაპზე გამოქვეყნებული ღონისძიებები ან პროფესიული განვითარების შესაძლებლობები არ არის.'}
              {filtered && (
                <>
                  <br />
                  <Link className="vh-events-reset" href="/events">
                    ყველა ჩანაწერის ნახვა
                  </Link>
                </>
              )}
            </EmptyState>
          )}
          {results.totalPages > 1 && (
            <nav aria-label="ღონისძიებების გვერდები" className="vh-events-pagination">
              {results.page > 1 ? (
                <Button asChild variant="outline" size="lg">
                  <Link rel="prev" href={eventsURL({ ...filters, page: results.page - 1 })}>
                    წინა გვერდი
                  </Link>
                </Button>
              ) : (
                <span aria-hidden="true" />
              )}
              <span>
                გვერდი {results.page} / {results.totalPages}
              </span>
              {results.page < results.totalPages ? (
                <Button asChild variant="outline" size="lg">
                  <Link rel="next" href={eventsURL({ ...filters, page: results.page + 1 })}>
                    შემდეგი გვერდი
                  </Link>
                </Button>
              ) : (
                <span aria-hidden="true" />
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
  searchParams: SearchParams
}): Promise<Metadata> {
  const params = await searchParams
  return {
    title: 'ღონისძიებები და პროფესიული განვითარება | VascHub',
    description:
      'სისხლძარღვთა ქირურგიის პროფესიული ღონისძიებები, ტრენინგები და განვითარების შესაძლებლობები.',
    alternates: { canonical: '/events' },
    robots: Object.keys(params).length ? { index: false, follow: true } : undefined,
  }
}
