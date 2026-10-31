import { Card } from '@/components/ui/card'
import { publicWebsite } from './values'
type Contact = {
  website?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  professionalLinks?: { label: string; url: string }[] | null
}
export function DirectoryContact({ contact: c }: { contact: Contact }) {
  const website = publicWebsite(c.website),
    links = (c.professionalLinks || []).flatMap((l) => {
      const url = publicWebsite(l.url)
      return url ? [{ ...l, url }] : []
    }),
    phone = c.phone?.replace(/[^\d+]/g, '')
  if (!website && !c.email && !c.phone && !c.address && !links.length) return null
  return (
    <Card className="vd-contact">
      <h2>საჯარო საკონტაქტო ინფორმაცია</h2>
      <dl>
        {c.address && (
          <div>
            <dt>მისამართი</dt>
            <dd>{c.address}</dd>
          </div>
        )}
        {c.phone && (
          <div>
            <dt>ტელეფონი</dt>
            <dd>{phone && /\d/.test(phone) ? <a href={`tel:${phone}`}>{c.phone}</a> : c.phone}</dd>
          </div>
        )}
        {c.email && (
          <div>
            <dt>ელფოსტა</dt>
            <dd>
              <a href={`mailto:${encodeURIComponent(c.email).replace('%40', '@')}`}>{c.email}</a>
            </dd>
          </div>
        )}
        {website && (
          <div>
            <dt>ვებგვერდი</dt>
            <dd>
              <a href={website} target="_blank" rel="noopener noreferrer">
                ოფიციალური / პროფესიული ვებგვერდი<span className="sr-only"> — ახალ ჩანართში</span>
              </a>
            </dd>
          </div>
        )}
      </dl>
      {!!links.length && (
        <ul>
          {links.map((l, i) => (
            <li key={`${l.url}-${i}`}>
              <a href={l.url} target="_blank" rel="noopener noreferrer">
                {l.label}
                <span className="sr-only"> — ახალ ჩანართში</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
