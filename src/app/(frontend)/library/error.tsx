'use client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="vh-theme vh-library vh-library-loading">
      <h1>ბიბლიოთეკა ვერ ჩაიტვირთა</h1>
      <p role="alert">რესურსების მიღება დროებით ვერ მოხერხდა. სცადეთ ხელახლა.</p>
      <Button onClick={reset}>ხელახლა ცდა</Button> <Link href="/">მთავარი გვერდი</Link>
    </main>
  )
}
