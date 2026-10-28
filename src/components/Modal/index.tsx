'use client'
import React, { useCallback, useEffect, useId, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function useDialog() {
  const ref = useRef<HTMLDialogElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const open = useCallback(() => {
    returnFocus.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    ref.current?.showModal()
    setIsOpen(true)
  }, [])
  const close = useCallback(() => ref.current?.close(), [])
  const onClose = useCallback(() => {
    setIsOpen(false)
    returnFocus.current?.focus()
  }, [])
  useEffect(() => {
    if (!isOpen) return
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
    }
  }, [isOpen])
  return { ref, open, close, onClose }
}
export function Modal({
  dialogRef,
  onClose,
  onRequestClose,
  title,
  children,
  className = '',
}: {
  dialogRef: React.RefObject<HTMLDialogElement | null>
  onClose: () => void
  onRequestClose: () => void
  title: string
  children: React.ReactNode
  className?: string
}) {
  const id = useId()
  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={id}
      onClose={onClose}
      className={`vh-theme vh-dialog ${className}`}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return
        const r = event.currentTarget.getBoundingClientRect()
        if (
          event.clientX < r.left ||
          event.clientX > r.right ||
          event.clientY < r.top ||
          event.clientY > r.bottom
        )
          onRequestClose()
      }}
    >
      <div className="vh-dialog-heading">
        <h2 id={id}>{title}</h2>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="vh-icon-button"
          onClick={onRequestClose}
          aria-label="დახურვა"
        >
          <X size={22} aria-hidden="true" />
        </Button>
      </div>
      {children}
    </dialog>
  )
}
export function AvailabilityButton({
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
  const { ref: dialogRef, open, close, onClose } = useDialog()
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
      <Modal dialogRef={dialogRef} onClose={onClose} onRequestClose={close} title={title}>
        <p className="vh-availability-message">{message}</p>
      </Modal>
    </>
  )
}
