import Link from 'next/link'
import { ArrowRight, ArrowUpRight, CalendarDays, MapPin } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { formatDay } from '@/Events/dates'
import { eventTypes } from '@/Events/filters'
import type { EventItem } from '@/Events/types'

/**
 * One public item. The title is the only link (stretched over the card by CSS), so the card
 * has a single tab stop and a meaningful accessible name. Dates and places are shown only
 * when the source really contains them.
 */
export function EventCard({ item }: { item: EventItem }) {
  const titleId = `event-${item.key}`
  const external = item.link.kind === 'external'
  const label = (
    <>
      {item.title}
      {external && <span className="sr-only"> (იხსნება ახალ ფანჯარაში)</span>}
    </>
  )
  return (
    <Card
      className="vh-events-card"
      data-testid="event-card"
      data-status={item.dateStatus}
      data-source={item.source}
    >
      <ul className="vh-events-badges" aria-label="ტიპი">
        {eventTypes
          .filter((type) => item.types.includes(type.value))
          .map((type) => (
            <li key={type.value} data-type={type.value}>
              {type.label}
            </li>
          ))}
      </ul>
      <h3 id={titleId}>
        {external ? (
          <a
            className="vh-events-card-link"
            href={item.link.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {label}
          </a>
        ) : (
          <Link className="vh-events-card-link" href={item.link.href}>
            {label}
          </Link>
        )}
      </h3>
      {item.description && <p className="vh-events-description">{item.description}</p>}
      <div className="vh-events-meta">
        <p>
          <CalendarDays size={16} aria-hidden="true" />
          {item.day ? (
            <time dateTime={item.day}>{formatDay(item.day)}</time>
          ) : (
            <span>თარიღი დასაზუსტებელია</span>
          )}
          {item.dateStatus === 'past' && <span className="vh-events-past">ჩატარებულია</span>}
        </p>
        {item.location && (
          <p>
            <MapPin size={16} aria-hidden="true" />
            <span>{item.location}</span>
          </p>
        )}
      </div>
      <span className="vh-events-action" aria-hidden="true">
        {external ? 'ბმულზე გადასვლა' : 'დეტალურად'}
        {external ? <ArrowUpRight size={18} /> : <ArrowRight size={18} />}
      </span>
    </Card>
  )
}
