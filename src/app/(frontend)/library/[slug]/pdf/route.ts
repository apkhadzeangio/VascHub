import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { getPayload } from 'payload'
import config from '@payload-config'
import { findPublicResource } from '@/Library/queries'
import { availablePDF } from '@/Library/pdf'
import { libraryFilesDir, MAX_PDF_BYTES } from '@/Library/files'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
const headers = {
  'Cache-Control': 'private, no-store',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow',
}
const missing = () => new Response('ფაილი ვერ მოიძებნა.', { status: 404, headers })

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const payload = await getPayload({ config })
  const resource = await findPublicResource(payload, (await params).slug)
  if (!resource?.pdf) return missing()
  const file = await availablePDF(payload, resource)
  if (!file?.filename) return missing()
  let buffer: Buffer
  try {
    buffer = await readFile(path.join(libraryFilesDir, file.filename))
  } catch (error) {
    if (['ENOENT', 'ENOTDIR'].includes((error as NodeJS.ErrnoException).code ?? ''))
      return missing()
    throw error
  }
  if (buffer.length > MAX_PDF_BYTES) return missing()
  return new Response(new Uint8Array(buffer), {
    headers: {
      ...headers,
      'Content-Type': 'application/pdf',
      'Content-Length': String(buffer.length),
      'Content-Disposition': `attachment; filename="resource-${resource.id}.pdf"; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
      'Content-Security-Policy': "sandbox; default-src 'none'",
    },
  })
}
