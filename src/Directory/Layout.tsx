import Link from 'next/link'
import type { ReactNode } from 'react'
import type { DirectoryKind } from './values'
import './styles.css'
export function DirectoryLayout({ children, kind }: { children: ReactNode; kind: DirectoryKind }) {
  return (
    <div className="vh-theme vh-directory">
      <div className="vh-container">
        <nav className="vd-breadcrumb" aria-label="ცნობარის მდებარეობა">
          <Link href="/">მთავარი</Link>
          <span aria-hidden="true">/</span>
          <span>პროფესიული ქსელი</span>
        </nav>
        <nav className="vd-tabs" aria-label="პროფესიული ცნობარი">
          <Link href="/specialists" aria-current={kind === 'specialists' ? 'page' : undefined}>
            სპეციალისტები
          </Link>
          <Link href="/centres" aria-current={kind === 'centres' ? 'page' : undefined}>
            სისხლძარღვთა ცენტრები
          </Link>
        </nav>
        {children}
      </div>
    </div>
  )
}
