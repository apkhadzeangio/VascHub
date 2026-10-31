import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Card } from '@/components/ui/card'
import { SpecialistCard, Tags } from '@/Directory/Cards'
import { DirectoryContact } from '@/Directory/Contact'
import { DirectoryPhoto } from '@/Directory/Photo'
import { DirectoryPagination } from '@/Directory/Pagination'
import { findPublicCentre, querySpecialists } from '@/Directory/queries'
import {
  directoryURL,
  parseDirectoryFilters,
  profileURL,
  type SearchParams,
} from '@/Directory/values'
type Args = { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> }
const load = cache(async (slug: string) => findPublicCentre(await getPayload({ config }), slug))
export default async function CentrePage({ params, searchParams }: Args) {
  const c = await load((await params).slug)
  if (!c) notFound()
  const f = parseDirectoryFilters({ page: (await searchParams).page, centre: c.slug }),
    ss = await querySpecialists(await getPayload({ config }), f)
  return (
    <main className="vd-main" tabIndex={-1}>
      <Link href="/centres" className="vd-back">
        ← ცენტრების ცნობარი
      </Link>
      <article>
        <header className="vd-profile-heading">
          <DirectoryPhoto image={c.image} centre />
          <div>
            <h1>{c.name}</h1>
            <p className="vd-city">{c.city}</p>
            <Tags values={c.directions} />
          </div>
        </header>
        <div className="vd-detail-grid">
          <Card className="vd-body">
            <h2>ცენტრის შესახებ</h2>
            <p className="vd-description">{c.summary}</p>
          </Card>
          <DirectoryContact contact={c} />
        </div>
      </article>
      <section aria-labelledby="centre-specialists">
        <div className="vd-results-heading">
          <h2 id="centre-specialists">ცენტრის სპეციალისტები</h2>
          <p role="status">მოიძებნა: {ss.totalDocs}</p>
        </div>
        {ss.docs.length ? (
          <div className="vd-grid">
            {ss.docs.map((s) => (
              <SpecialistCard key={s.id} specialist={s} />
            ))}
          </div>
        ) : (
          <div className="vd-empty">
            <p>ამ გვერდზე გამოქვეყნებული სპეციალისტები ჯერ არ არის.</p>
          </div>
        )}
        <DirectoryPagination
          page={f.page}
          totalPages={ss.totalPages}
          href={(page) => `${profileURL('centres', c)}${page > 1 ? `?page=${page}` : ''}`}
        />
        <Link className="vd-back" href={directoryURL('specialists', { centre: c.slug })}>
          სპეციალისტების ძიება ამ ცენტრში →
        </Link>
      </section>
    </main>
  )
}
export async function generateMetadata({ params, searchParams }: Args): Promise<Metadata> {
  const c = await load((await params).slug)
  if (!c) return { title: 'ცენტრი ვერ მოიძებნა | VascHub', robots: { index: false } }
  return {
    title: `${c.name} | VascHub`,
    description: c.summary.slice(0, 300),
    alternates: { canonical: profileURL('centres', c) },
    robots: Object.keys(await searchParams).length ? { index: false, follow: true } : undefined,
  }
}
