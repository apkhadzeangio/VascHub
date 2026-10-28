import clsx from 'clsx'
import Image from 'next/image'
import React from 'react'
interface Props {
  className?: string
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
  inverse?: boolean
}
export const Logo = ({ className, inverse = false, loading = 'eager' }: Props) => (
  <span className={clsx('vh-logo', inverse && 'vh-logo-inverse', className)}>
    <Image src="/vaschub-mark.svg" alt="" width={34} height={34} loading={loading} aria-hidden="true" />
    <span>VascHub</span>
  </span>
)
