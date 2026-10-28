import { getCachedGlobal } from '@/utilities/getGlobals'
import Link from 'next/link'
import React from 'react'
import { CMSLink } from '@/components/Link'
import { Logo } from '@/components/Logo/Logo'
import { AvailabilityButton } from '@/components/Modal'
export async function Footer() {
  const data = await getCachedGlobal('footer', 1)()
  return (
    <footer className="vh-theme vh-footer" id="about">
      <div className="vh-container vh-footer-content">
        <div className="vh-footer-brand">
          <Link href="/" aria-label="VascHub — მთავარი გვერდი">
            <Logo inverse />
          </Link>
          <p>საქართველოს სისხლძარღვთა ქირურგიის პროფესიული პლატფორმა.</p>
          <p className="vh-footer-membership">წევრობა მოგვიანებით დაემატება.</p>
        </div>
        <div className="vh-footer-side">
          <nav aria-label="დამატებითი ინფორმაცია">
            {data.navItems?.length ? (
              data.navItems.map(({ link }, i) => (
                <CMSLink key={i} {...link} className="vh-footer-link" />
              ))
            ) : (
              <>
                <Link href="/#about">ჩვენ შესახებ</Link>
                <AvailabilityButton
                  title="კონტაქტი"
                  message="საკონტაქტო ინფორმაცია მოგვიანებით გამოქვეყნდება."
                >
                  კონტაქტი
                </AvailabilityButton>
                <AvailabilityButton
                  title="კონფიდენციალურობა"
                  message="კონფიდენციალურობის შესახებ ინფორმაცია მოგვიანებით გამოქვეყნდება."
                >
                  კონფიდენციალურობა
                </AvailabilityButton>
              </>
            )}
          </nav>
          <small>© {new Date().getFullYear()} VascHub</small>
        </div>
      </div>
    </footer>
  )
}
