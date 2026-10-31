import Link from 'next/link'
import { Button } from '@/components/ui/button'
export function DirectoryPagination({
  page,
  totalPages,
  href,
}: {
  page: number
  totalPages: number
  href: (page: number) => string
}) {
  if (totalPages <= 1 && page <= 1) return null
  return (
    <nav className="vd-pagination" aria-label="ცნობარის გვერდები">
      {page > 1 && (
        <Button asChild variant="outline" size="lg">
          <Link href={href(Math.min(page - 1, Math.max(1, totalPages)))}>წინა გვერდი</Link>
        </Button>
      )}
      <span>
        გვერდი {page} · სულ: {totalPages}
      </span>
      {page < totalPages && (
        <Button asChild variant="outline" size="lg">
          <Link href={href(page + 1)}>შემდეგი გვერდი</Link>
        </Button>
      )}
    </nav>
  )
}
