import clsx from 'clsx'
import React from 'react'

interface Props {
  className?: string
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
}

export const Logo = ({ className }: Props) => (
  <span className={clsx('text-2xl font-semibold tracking-tight', className)}>VascHub</span>
)
