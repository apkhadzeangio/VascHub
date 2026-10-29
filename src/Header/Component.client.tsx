'use client'
import Link from 'next/link'
import React, { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, UserRound } from 'lucide-react'
import type { Header } from '@/payload-types'
import { Logo } from '@/components/Logo/Logo'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/Modal'
import {
  SiteAvailabilityButton as AvailabilityButton,
  useSiteDialog,
} from '@/components/site-ui/Dialog'
import { HeaderNav } from './Nav'
const memberMessage =
  'წევრობა და პირადი სივრცე მოგვიანებით დაემატება. ამ ეტაპზე გამოქვეყნებული მასალების წაკითხვა თავისუფლად შეგიძლიათ.'
function MemberAction({ account = false, icon = false }: { account?: boolean; icon?: boolean }) {
  return (
    <AvailabilityButton
      title="წევრის სივრცე მზადდება"
      message={memberMessage}
      label={account ? 'პირადი კაბინეტი — მალე' : 'შესვლა — მალე'}
      className={
        icon ? 'vh-icon-button vh-account-icon' : account ? 'vh-account-button' : 'vh-login-button'
      }
    >
      {icon ? <UserRound size={22} aria-hidden="true" /> : account ? 'პირადი კაბინეტი' : 'შესვლა'}
      {!icon && <span className="vh-soon">მალე</span>}
    </AvailabilityButton>
  )
}
export function HeaderClient({ data }: { data: Header }) {
  const {
    ref: menuRef,
    open: openMenu,
    close: closeMenu,
    onClose: menuClosed,
    isOpen,
  } = useSiteDialog()
  const pathname = usePathname()
  useEffect(() => closeMenu(), [pathname, closeMenu])
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)')
    const closeOnDesktop = () => {
      if (!desktop.matches) return
      // Close child notices before their parent menu is hidden.
      menuRef.current
        ?.querySelectorAll<HTMLDialogElement>('dialog[open]')
        .forEach((dialog) => dialog.close())
      closeMenu()
    }
    desktop.addEventListener('change', closeOnDesktop)
    return () => desktop.removeEventListener('change', closeOnDesktop)
  }, [closeMenu, menuRef])
  return (
    <header className="vh-theme vh-header">
      <a href="#main-content" className="vh-skip-link">
        კონტენტზე გადასვლა
      </a>
      <div className="vh-utility">
        <div className="vh-container">
          <span>პროფესიული ცოდნა • საქართველო</span>
          <span className="vh-utility-detail">VascHub • პროფესიული პლატფორმა</span>
        </div>
      </div>
      <div className="vh-container">
        <div className="vh-brand-row">
          <Link href="/" aria-label="VascHub — მთავარი გვერდი">
            <Logo />
          </Link>
          <div className="vh-desktop-actions">
            <MemberAction />
            <MemberAction account />
          </div>
          <div className="vh-mobile-actions">
            <MemberAction account icon />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="vh-icon-button"
              onClick={openMenu}
              aria-label="მენიუს გახსნა"
              aria-haspopup="dialog"
              aria-expanded={isOpen}
            >
              <Menu size={22} aria-hidden="true" />
            </Button>
          </div>
        </div>
        <HeaderNav data={data} className="vh-desktop-nav" />
      </div>
      <Modal
        dialogRef={menuRef}
        onClose={menuClosed}
        onRequestClose={closeMenu}
        title="VascHub — მენიუ"
        className="vh-mobile-menu"
      >
        <HeaderNav data={data} className="vh-menu-navigation" onNavigate={closeMenu} />
        <div className="vh-menu-member-actions">
          <MemberAction />
          <MemberAction account />
        </div>
        <p className="vh-menu-note">წევრის სივრცე და პროფესიული ქსელი მზადდება.</p>
      </Modal>
    </header>
  )
}
