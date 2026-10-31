'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function EventsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="vh-theme vh-events vh-events-loading">
      <div className="vh-container">
        <h1>ღონისძიებები ვერ ჩაიტვირთა</h1>
        <p role="alert">მონაცემების მიღება დროებით ვერ მოხერხდა. სცადეთ ხელახლა.</p>
        <div className="vh-events-error-actions">
          <Button onClick={reset}>ხელახლა ცდა</Button>
          <Link href="/">მთავარი გვერდი</Link>
        </div>
      </div>
    </main>
  )
}
