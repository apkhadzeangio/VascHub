import type { Metadata } from 'next'
import { DirectoryCatalog } from '@/Directory/Catalog'
import type { SearchParams } from '@/Directory/values'
export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <DirectoryCatalog kind="specialists" searchParams={searchParams} />
}
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}): Promise<Metadata> {
  return {
    title: 'სპეციალისტების ცნობარი | VascHub',
    description: 'საჯარო პროფესიული ცნობარი',
    alternates: { canonical: '/specialists' },
    robots: Object.keys(await searchParams).length ? { index: false, follow: true } : undefined,
  }
}
