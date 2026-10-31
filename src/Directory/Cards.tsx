import Link from 'next/link'
import { MapPin, ArrowUpRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import type { PublicCentre, PublicSpecialist } from './queries'
import { profileURL } from './values'
import { DirectoryPhoto } from './Photo'
export function Tags({ values }: { values?: string[] | null }) {
  return values?.length ? (
    <ul className="vd-tags" aria-label="პროფესიული მიმართულებები">
      {values.map((v) => (
        <li key={v}>{v}</li>
      ))}
    </ul>
  ) : null
}
export function SpecialistCard({ specialist: s }: { specialist: PublicSpecialist }) {
  return (
    <Card className="vd-card" data-directory-card="specialist">
      <DirectoryPhoto image={s.photo} />
      <div className="vd-card-content">
        <h3>
          <Link href={profileURL('specialists', s)}>
            {s.name}
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </h3>
        <p className="vd-city">
          <MapPin size={15} aria-hidden="true" />
          {s.city}
        </p>
        <Tags values={s.specializations} />
        <p className="vd-summary">{s.summary}</p>
        {!!s.centres.length && (
          <ul className="vd-affiliations">
            {s.centres.map((c) => (
              <li key={c.id}>
                <Link href={profileURL('centres', c)}>{c.name}</Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}
export function CentreCard({ centre: c }: { centre: PublicCentre }) {
  return (
    <Card className="vd-card" data-directory-card="centre">
      <DirectoryPhoto image={c.image} centre />
      <div className="vd-card-content">
        <h3>
          <Link href={profileURL('centres', c)}>
            {c.name}
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </h3>
        <p className="vd-city">
          <MapPin size={15} aria-hidden="true" />
          {c.city}
        </p>
        <Tags values={c.directions} />
        <p className="vd-summary">{c.summary}</p>
        {c.address && <p className="vd-address">{c.address}</p>}
      </div>
    </Card>
  )
}
