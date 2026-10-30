'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/Modal'

// The document owns the lock so separate client entry points share the same state.
type ScrollLockBody = HTMLBodyElement & {
  __vaschubDialogScroll?: {
    owners: Set<HTMLDialogElement>
    previousOverflow: string
  }
}
function lockScroll(dialog: HTMLDialogElement) {
  const body = document.body as ScrollLockBody
  const state = body.__vaschubDialogScroll ??= {
    owners: new Set(),
    previousOverflow: body.style.overflow,
  }
  state.owners.add(dialog)
  body.style.overflow = 'hidden'
}
function unlockScroll(dialog: HTMLDialogElement | null) {
  if (!dialog) return
  const body = document.body as ScrollLockBody
  const state = body.__vaschubDialogScroll
  if (!state?.owners.delete(dialog)) return
  body.style.overflow = state.owners.size ? 'hidden' : state.previousOverflow
  if (!state.owners.size) delete body.__vaschubDialogScroll
}

export function useSiteDialog() {
  const ref = useRef<HTMLDialogElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const open = useCallback(() => {
    if (!ref.current || ref.current.open) return
    returnFocus.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    ref.current.showModal()
    lockScroll(ref.current)
    setIsOpen(true)
  }, [])
  const close = useCallback(() => {
    // Native close events arrive asynchronously; release the lock immediately.
    ref.current?.close()
    unlockScroll(ref.current)
    setIsOpen(false)
  }, [])
  const onClose = useCallback(() => {
    // A native close event may arrive after the same dialog has already reopened.
    if (ref.current?.open) return
    unlockScroll(ref.current)
    setIsOpen(false)
    const target = returnFocus.current
    if (target?.isConnected && target.getClientRects().length) target.focus({ preventScroll: true })
  }, [])
  useEffect(() => {
    const dialog = ref.current
    return () => unlockScroll(dialog)
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
