import Link from 'next/link'
import { ArrowRight, SearchIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { whenOptions } from '@/Events/filters'
import type { EventFilters } from '@/Events/types'

/**
 * Plain GET form with no client-side state: every active filter lives in the address bar.
 * The date filter is rendered only when the data contains valid structured dates.
 */
export function EventFilterForm({
  filters,
  showWhen,
}: {
  filters: EventFilters
  showWhen: boolean
}) {
  const active = Boolean(filters.q || filters.type || filters.when)
  return (
    <form
      action="/events"
      method="get"
      role="search"
      aria-label="ღონისძიებებისა და განვითარების შესაძლებლობების ძიება"
      className="vh-events-filters"
    >
      {filters.type && <input type="hidden" name="type" value={filters.type} />}
      <div className="vh-search">
        <Label htmlFor="events-search" className="sr-only">
          საძიებო სიტყვა
        </Label>
        <SearchIcon className="vh-search-icon" size={22} aria-hidden="true" />
        <Input
          id="events-search"
          name="q"
          type="search"
          defaultValue={filters.q}
          maxLength={160}
          placeholder="მოძებნე სათაური, ადგილი ან თემა"
          className="vh-search-input"
        />
        <Button type="submit" size="lg" className="vh-search-submit" aria-label="ძიება">
          <span>ძიება</span>
          <ArrowRight size={20} aria-hidden="true" />
        </Button>
      </div>
      {(showWhen || active) && (
        <div className="vh-events-filter-row">
          {showWhen && (
            <div>
              <Label htmlFor="events-when">თარიღი</Label>
              <select id="events-when" name="when" defaultValue={filters.when}>
                <option value="">ყველა თარიღი</option>
                {whenOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          {showWhen && (
            <Button type="submit" size="lg" variant="outline">
              ფილტრის გამოყენება
            </Button>
          )}
          {active && (
            <Link className="vh-events-reset" href="/events">
              ფილტრების გასუფთავება
            </Link>
          )}
        </div>
      )}
    </form>
  )
}
