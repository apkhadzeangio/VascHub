'use client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
export function DirectoryError({ reset }: { reset: () => void }) {
  return (
    <main className="vd-state" role="alert">
      <h1>ცნობარი დროებით მიუწვდომელია</h1>
      <p>მონაცემები ვერ ჩაიტვირთა. სცადეთ ხელახლა.</p>
      <Button onClick={reset} size="lg">
        ხელახლა ცდა
      </Button>
      <Link href="/specialists">სპეციალისტების ცნობარი</Link>
    </main>
  )
}
export function DirectoryLoading() {
  return (
    <main className="vd-state" aria-busy="true">
      <p role="status">ცნობარი იტვირთება…</p>
    </main>
  )
}
