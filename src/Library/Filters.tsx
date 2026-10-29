import Link from 'next/link'
import { SearchIcon, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { resourceLanguages } from './options'
import type { LibraryFilters } from './queries'

type Option = { id: number; title: string; slug?: string | null }
export function LibraryFilterForm({
  filters,
  topics,
  types,
  organizations,
}: {
  filters: LibraryFilters
  topics: Option[]
  types: Option[]
  organizations: Option[]
}) {
  const selects = [
    { name: 'topic', label: 'კლინიკური თემა', all: 'ყველა თემა', options: topics },
    { name: 'type', label: 'მასალის ტიპი', all: 'ყველა ტიპი', options: types },
    {
      name: 'organization',
      label: 'ორგანიზაცია',
      all: 'ყველა ორგანიზაცია',
      options: organizations,
    },
  ] as const
  return (
    <form
      action="/library"
      method="get"
      role="search"
      aria-label="კლინიკური ბიბლიოთეკის ძიება"
      className="vh-library-filters"
    >
      <div className="vh-search">
        <Label htmlFor="library-search" className="sr-only">
          საძიებო სიტყვა
        </Label>
        <SearchIcon className="vh-search-icon" size={22} aria-hidden="true" />
        <Input
          id="library-search"
          name="q"
          type="search"
          defaultValue={filters.q}
          maxLength={160}
          placeholder="მოძებნე სათაური, აბრევიატურა ან თემა"
          className="vh-search-input"
        />
        <Button type="submit" size="lg" className="vh-search-submit" aria-label="ძიება">
          <span>ძიება</span>
          <ArrowRight size={20} aria-hidden="true" />
        </Button>
      </div>
      <div className="vh-library-filter-grid">
        {selects.map((s) => (
          <div key={s.name}>
            <Label htmlFor={`library-${s.name}`}>{s.label}</Label>
            <select id={`library-${s.name}`} name={s.name} defaultValue={filters[s.name]}>
              <option value="">{s.all}</option>
              {s.options.map((o) => (
                <option key={o.id} value={o.slug || ''}>
                  {o.title}
                </option>
              ))}
              {filters[s.name] && !s.options.some((o) => o.slug === filters[s.name]) && (
                <option value={filters[s.name]}>უცნობი მნიშვნელობა</option>
              )}
            </select>
          </div>
        ))}
        <div>
          <Label htmlFor="library-language">ენა</Label>
          <select id="library-language" name="language" defaultValue={filters.language}>
            <option value="">ყველა ენა</option>
            {resourceLanguages.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="library-year">გამოცემის წელი</Label>
          <Input
            id="library-year"
            name="year"
            type="number"
            min="1900"
            max="2100"
            placeholder="ყველა წელი"
            defaultValue={filters.year}
          />
        </div>
        <div>
          <Label htmlFor="library-sort">დალაგება</Label>
          <select id="library-sort" name="sort" defaultValue={filters.sort}>
            <option value="added">ბოლოს დამატებული</option>
            <option value="year">უახლესი გამოცემა</option>
            <option value="title">ანბანურად</option>
          </select>
        </div>
      </div>
      <div className="vh-library-filter-actions">
        <Button type="submit" size="lg" variant="outline">
          ფილტრების გამოყენება
        </Button>
        <Link href="/library">გასუფთავება</Link>
      </div>
    </form>
  )
}
