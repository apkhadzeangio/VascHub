import Link from 'next/link'
import { SearchIcon, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { Category } from '@/payload-types'
import { resourceTypes, resourceLanguages } from './options'
import type { LibraryFilters } from './queries'

export function LibraryFilterForm({
  filters,
  categories,
}: {
  filters: LibraryFilters
  categories: Category[]
}) {
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
          placeholder="მოძებნე რესურსი, ავტორი ან თემა"
          className="vh-search-input"
        />
        <Button type="submit" size="lg" className="vh-search-submit" aria-label="ძიება">
          <span>ძიება</span>
          <ArrowRight size={20} aria-hidden="true" />
        </Button>
      </div>
      <div className="vh-library-filter-grid">
        <div>
          <Label htmlFor="library-category">კლინიკური თემა</Label>
          <select id="library-category" name="category" defaultValue={filters.category}>
            <option value="">ყველა თემა</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug ?? ''}>
                {c.title}
              </option>
            ))}
            {filters.category && !categories.some((c) => c.slug === filters.category) && (
              <option value={filters.category}>უცნობი თემა</option>
            )}
          </select>
        </div>
        <div>
          <Label htmlFor="library-type">მასალის ტიპი</Label>
          <select id="library-type" name="type" defaultValue={filters.type}>
            <option value="">ყველა ტიპი</option>
            {resourceTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
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
            <option value="updated">ბოლო განახლება</option>
            <option value="year">გამოცემის წელი</option>
            <option value="title">სათაური</option>
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
