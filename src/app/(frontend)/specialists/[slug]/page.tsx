import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Card } from '@/components/ui/card'
import { Tags } from '@/Directory/Cards'
import { DirectoryContact } from '@/Directory/Contact'
import { DirectoryPhoto } from '@/Directory/Photo'
import { findPublicSpecialist } from '@/Directory/queries'
import { profileURL } from '@/Directory/values'
type Args = { params: Promise<{ slug: string }> }
const load = cache(async (slug: string) => findPublicSpecialist(await getPayload({ config }), slug))
export default async function SpecialistPage({ params }: Args) {
  const s = await load((await params).slug)
  if (!s) notFound()
  return (
    <main className="vd-main" tabIndex={-1}>
      <Link href="/specialists" className="vd-back">
        ← სპეციალისტების ცნობარი
      </Link>
      <article>
        <header className="vd-profile-heading">
          <DirectoryPhoto image={s.photo} />
          <div>
            <h1>{s.name}</h1>
            <p className="vd-city">{s.city}</p>
            <Tags values={s.specializations} />
          </div>
        </header>
        <div className="vd-detail-grid">
          <Card className="vd-body">
            <h2>პროფესიული ინფორმაცია</h2>
            <p className="vd-description">{s.summary}</p>
            {!!s.centres.length && (
              <section>
                <h2>დაკავშირებული ცენტრები</h2>
                <ul className="vd-affiliations">
                  {s.centres.map((c) => (
                    <li key={c.id}>
                      <Link href={profileURL('centres', c)}>
                        {c.name} · {c.city}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </Card>
          <DirectoryContact contact={s} />
        </div>
      </article>
    </main>
  )
}
export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const s = await load((await params).slug)
  return s
    ? {
        title: `${s.name} | VascHub`,
        description: s.summary.slice(0, 300),
        alternates: { canonical: profileURL('specialists', s) },
      }
    : { title: 'პროფილი ვერ მოიძებნა | VascHub', robots: { index: false } }
}
