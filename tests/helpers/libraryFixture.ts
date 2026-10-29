import type { Payload } from 'payload'
import { assertTestDatabase } from './homepageFixture'

export const libraryEditor = {
  email: 'library-editor@vaschub.test',
  password: 'test-only-library-password-123',
}

export function fixturePDF() {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 300] /Resources << >> /Contents 4 0 R >>',
    '<< /Length 0 >>\nstream\n\nendstream',
  ]
  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf))
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xref = Buffer.byteLength(pdf)
  pdf += `xref\n0 5\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((o) => `${String(o).padStart(10, '0')} 00000 n \n`)
    .join('')}trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  const data = Buffer.from(pdf)
  return {
    data,
    mimetype: 'application/pdf',
    name: `test-only-${Date.now()}.pdf`,
    size: data.length,
  }
}

export async function seedLibraryFixture(payload: Payload) {
  assertTestDatabase()
  const suffix = Date.now()
  const user = await payload.create({
    collection: 'users',
    context: { bootstrapAdmin: true },
    data: libraryEditor,
  })
  const editor = { ...user, collection: 'users' as const }
  const category = await payload.create({
    collection: 'categories',
    data: { title: 'ბიბლიოთეკისტესტითემა', slug: `library-test-${suffix}` },
  })
  const file = await payload.create({
    collection: 'library-files',
    overrideAccess: false,
    user: editor,
    data: {
      title: 'სატესტო PDF — კლინიკური შინაარსის გარეშე',
      rightsConfirmed: true,
      rightsNote: 'ავტომატურად გენერირებული ცარიელი სატესტო დოკუმენტი.',
    },
    file: fixturePDF(),
  })
  const base = {
    description: 'სატესტო აღწერა. არ შეიცავს სამეცნიერო მტკიცებებს ან კლინიკურ რეკომენდაციებს.',
    resourceType: 'education' as const,
    authors: 'სატესტოგამომცემელი',
    year: 2026,
    language: 'ka' as const,
    categories: [category.id],
    keywords: 'ბიბლიოთეკისძიება, სატესტოკვანძი',
    sourceUrl: 'https://example.org/',
  }
  const resources = []
  for (let i = 0; i < 13; i++)
    resources.push(
      await payload.create({
        collection: 'library-resources',
        user: editor,
        overrideAccess: false,
        data: {
          ...base,
          title: `სატესტო ბიბლიოთეკის რესურსი ${i}`,
          slug: `library-public-${suffix}-${i}`,
          _status: 'published',
          pdf: i === 0 ? file.id : undefined,
          resourceType: i === 0 ? 'guideline' : 'education',
          year: i === 0 ? 2025 : 2026,
          language: i === 0 ? 'en' : 'ka',
        },
      }),
    )
  const draft = await payload.create({
    collection: 'library-resources',
    user: editor,
    overrideAccess: false,
    draft: true,
    data: {
      ...base,
      title: 'დაფარულიბიბლიოთეკა — სატესტო მონახაზი',
      slug: `library-draft-${suffix}`,
      pdf: file.id,
      _status: 'draft',
    },
  })
  return { user, editor, category, file, resources, draft, base }
}

export async function cleanupLibraryFixture(
  payload: Payload,
  fixture: Awaited<ReturnType<typeof seedLibraryFixture>>,
) {
  for (const resource of [...fixture.resources, fixture.draft])
    await payload.delete({ collection: 'library-resources', id: resource.id })
  await payload.delete({ collection: 'library-files', id: fixture.file.id })
  await payload.delete({ collection: 'categories', id: fixture.category.id })
  await payload.delete({ collection: 'users', id: fixture.user.id })
}
