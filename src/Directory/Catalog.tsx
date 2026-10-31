import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { CentreCard, SpecialistCard } from './Cards'
import { DirectoryFilterForm } from './Filters'
import { DirectoryPagination } from './Pagination'
import { directoryFacets, queryCentres, querySpecialists } from './queries'
import {
  directoryURL,
  parseDirectoryFilters,
  type DirectoryKind,
  type SearchParams,
} from './values'
export async function DirectoryCatalog({
  kind,
  searchParams,
}: {
  kind: DirectoryKind
  searchParams: Promise<SearchParams>
}) {
  const f = parseDirectoryFilters(await searchParams),
    payload = await getPayload({ config })
  const [facets, ss, cc] = await Promise.all([
    directoryFacets(payload, kind),
    kind === 'specialists' ? querySpecialists(payload, f) : null,
    kind === 'centres' ? queryCentres(payload, f) : null,
  ])
  const result = ss ?? cc!,
    filtered = !!(
      f.q ||
      f.city ||
      f.page > 1 ||
      (kind === 'specialists' && (f.specialization || f.centre))
    )
  return (
    <main className="vd-main" tabIndex={-1}>
      <header className="vd-intro">
        <p className="vh-eyebrow">პროფესიული ქსელი</p>
        <h1>{kind === 'specialists' ? 'სპეციალისტების ცნობარი' : 'სისხლძარღვთა ცენტრები'}</h1>
        <p>
          {kind === 'specialists'
            ? 'მოიძიეთ სპეციალისტი სახელით, ქალაქითა და პროფესიული მიმართულებით.'
            : 'მოიძიეთ ცენტრი და გაეცანით მის მიმართულებებსა და სპეციალისტებს.'}
        </p>
      </header>
      <DirectoryFilterForm key={JSON.stringify(f)} kind={kind} filters={f} facets={facets} />
      <section aria-labelledby="directory-results">
        <div className="vd-results-heading">
          <h2 id="directory-results">{kind === 'specialists' ? 'სპეციალისტები' : 'ცენტრები'}</h2>
          <p role="status">მოიძებნა: {result.totalDocs}</p>
        </div>
        {result.docs.length ? (
          <div className="vd-grid">
            {ss?.docs.map((s) => (
              <SpecialistCard key={s.id} specialist={s} />
            ))}
            {cc?.docs.map((c) => (
              <CentreCard key={c.id} centre={c} />
            ))}
          </div>
        ) : (
          <div className="vd-empty">
            <h3>{filtered ? 'შესაბამისი პროფილი ვერ მოიძებნა' : 'ცნობარი მზადდება'}</h3>
            <p>
              {filtered
                ? 'შეცვალეთ საძიებო სიტყვა ან გაასუფთავეთ ფილტრები.'
                : 'გამოქვეყნებული პროფილები ჯერ არ არის. ინფორმაცია გამოჩნდება ადმინისტრაციის მიერ გამოქვეყნების შემდეგ.'}
            </p>
            {filtered && <Link href={`/${kind}`}>ყველა პროფილის ნახვა</Link>}
          </div>
        )}
        <DirectoryPagination
          page={f.page}
          totalPages={result.totalPages}
          href={(page) => directoryURL(kind, { ...f, page })}
        />
      </section>
    </main>
  )
}
