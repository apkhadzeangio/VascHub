'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/Modal'

// Each open site dialog owns a lock, so closing a nested notice cannot unlock its menu.
const scrollLocks = new Set<symbol>()
let previousOverflow = ''
function lockScroll(key: symbol) {
  if (scrollLocks.has(key)) return
  if (!scrollLocks.size) previousOverflow = document.body.style.overflow
  scrollLocks.add(key)
  document.body.style.overflow = 'hidden'
}
function unlockScroll(key: symbol) {
  if (scrollLocks.delete(key) && !scrollLocks.size) document.body.style.overflow = previousOverflow
}

export function useSiteDialog() {
  const ref = useRef<HTMLDialogElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const lockKey = useRef(Symbol('site-dialog'))
  const [isOpen, setIsOpen] = useState(false)
  const open = useCallback(() => {
    if (!ref.current || ref.current.open) return
    returnFocus.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    ref.current.showModal()
    lockScroll(lockKey.current)
    setIsOpen(true)
  }, [])
  const close = useCallback(() => {
    // Native close events arrive asynchronously; release the lock immediately.
    ref.current?.close()
    unlockScroll(lockKey.current)
    setIsOpen(false)
  }, [])
  const onClose = useCallback(() => {
    unlockScroll(lockKey.current)
    setIsOpen(false)
    const target = returnFocus.current
    if (target?.isConnected && target.getClientRects().length) target.focus({ preventScroll: true })
  }, [])
  useEffect(() => {
    const key = lockKey.current
    return () => unlockScroll(key)
  }, [])
  return { ref, open, close, onClose, isOpen }
}

export function SiteAvailabilityButton({
  children,
  title,
  message,
  className = '',
  label,
}: {
  children: React.ReactNode
  title: string
  message: string
  className?: string
  label?: string
}) {
  const { ref, open, close, onClose } = useSiteDialog()
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        className={className}
        onClick={open}
        aria-label={label}
        aria-haspopup="dialog"
      >
        {children}
      </Button>
      <Modal dialogRef={ref} onClose={onClose} onRequestClose={close} title={title}>
        <p className="vh-availability-message">{message}</p>
      </Modal>
    </>
  )
}
