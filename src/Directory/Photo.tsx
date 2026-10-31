'use client'
import { useState } from 'react'
import Image from 'next/image'
import { Building2, UserRound } from 'lucide-react'
export function DirectoryPhoto({
  image,
  centre = false,
}: {
  image: { url: string; alt: string } | null
  centre?: boolean
}) {
  const [failedURL, setFailedURL] = useState<string | null>(null),
    Icon = centre ? Building2 : UserRound
  return (
    <div className={`vd-photo${centre ? ' vd-photo-centre' : ''}`}>
      {image && image.url !== failedURL ? (
        <Image
          src={image.url}
          alt={image.alt}
          width={192}
          height={192}
          unoptimized
          onError={() => setFailedURL(image.url)}
        />
      ) : (
        <Icon size={40} aria-hidden="true" />
      )}
    </div>
  )
}
