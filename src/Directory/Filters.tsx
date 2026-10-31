import Link from 'next/link'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { directoryFacets } from './queries'
import type { DirectoryKind, DirectoryFilters } from './values'
export function DirectoryFilterForm({
  kind,
  filters: f,
  facets,
}: {
  kind: DirectoryKind
  filters: DirectoryFilters
  facets: Awaited<ReturnType<typeof directoryFacets>>
}) {
  return (
    <form
      method="get"
      action={`/${kind}`}
      className="vd-filters"
      aria-label="ცნობარის ძიება და ფილტრები"
    >
      <div className={`vd-filter-grid ${kind === 'centres' ? 'vd-filter-centres' : ''}`}>
        <div>
          <label htmlFor="directory-q">
            {kind === 'specialists' ? 'სახელი და გვარი' : 'ცენტრის დასახელება'}
          </label>
          <input
            id="directory-q"
            name="q"
            type="search"
            defaultValue={f.q}
            maxLength={160}
            placeholder="ძიება…"
          />
        </div>
        <div>
          <label htmlFor="directory-city">ქალაქი</label>
          <select id="directory-city" name="city" defaultValue={f.city}>
            <option value="">ყველა ქალაქი</option>
            {f.city && !facets.cities.includes(f.city) && <option value={f.city}>{f.city}</option>}
            {facets.cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        {kind === 'specialists' && (
          <>
            <div>
              <label htmlFor="directory-specialization">სპეციალიზაცია</label>
              <select
                id="directory-specialization"
                name="specialization"
                defaultValue={f.specialization}
              >
                <option value="">ყველა მიმართულება</option>
                {f.specialization && !facets.specializations.includes(f.specialization) && (
                  <option value={f.specialization}>{f.specialization}</option>
                )}
                {facets.specializations.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="directory-centre">ცენტრი</label>
              <select id="directory-centre" name="centre" defaultValue={f.centre}>
                <option value="">ყველა ცენტრი</option>
                {f.centre && !facets.centres.some((c) => c.slug === f.centre) && (
                  <option value={f.centre}>ცენტრი მიუწვდომელია</option>
                )}
                {facets.centres.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>
      <div className="vd-filter-actions">
        <Button type="submit" size="lg">
          <Search size={18} aria-hidden="true" />
          ძებნა
        </Button>
        <Link href={`/${kind}`}>ფილტრების გასუფთავება</Link>
      </div>
    </form>
  )
}
