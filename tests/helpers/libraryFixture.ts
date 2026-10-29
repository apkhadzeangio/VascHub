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
  let attachment = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(attachment))
    attachment += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xref = Buffer.byteLength(attachment)
  attachment += `xref\n0 5\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((o) => `${String(o).padStart(10, '0')} 00000 n \n`)
    .join('')}trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  const data = Buffer.from(attachment)
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
  const topic = await payload.create({
    collection: 'library-topics',
    data: { title: 'ბიბლიოთეკისტესტითემა', slug: `library-test-${suffix}` },
  })
  const organization = await payload.create({
    collection: 'library-organizations',
    data: { title: 'სატესტოგამომცემელი', abbreviation: 'ESVS-TEST', slug: `library-org-${suffix}` },
  })
  const education = await payload.create({
    collection: 'library-document-types',
    data: { title: 'სასწავლო დოკუმენტი', slug: `education-${suffix}` },
  })
  const guideline = await payload.create({
    collection: 'library-document-types',
    data: { title: 'გაიდლაინი', slug: `guideline-${suffix}` },
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
    editionStatus: 'not-assessed' as const,
    accessType: 'external' as const,
    licenseStatus: 'external-only' as const,
    visibility: 'public' as const,
    summary: 'სატესტო აღწერა. არ შეიცავს სამეცნიერო მტკიცებებს ან კლინიკურ რეკომენდაციებს.',
    documentType: education.id,
    publisherOrganization: organization.id,
    lastReviewedAt: new Date().toISOString(),
    originalTitle: 'Test PAD CLTI Educational Resource',
    authors: 'სატესტოგამომცემელი',
    publicationYear: 2026,
    language: 'ka' as const,
    clinicalTopics: [topic.id],
    searchKeywords: 'ბიბლიოთეკისძიება, სატესტოკვანძი',
    officialSourceUrl: 'https://example.org/',
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
          attachment: i === 0 ? file.id : undefined,
          documentType: i === 0 ? guideline.id : education.id,
          accessType: i === 0 ? 'hosted' : 'external',
          attachmentType: i === 0 ? 'pdf' : 'none',
          licenseStatus: i === 0 ? 'owned' : 'external-only',
          rightsEvidence: i === 0 ? 'Programmatically generated empty test PDF' : undefined,
          publicationYear: i === 0 ? 2025 : 2026,
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
      attachment: file.id,
      accessType: 'hosted',
      attachmentType: 'pdf',
      licenseStatus: 'owned',
      rightsEvidence: 'Programmatically generated empty test PDF',
      _status: 'draft',
    },
  })
  return { user, editor, topic, organization, education, guideline, file, resources, draft, base }
}

export async function cleanupLibraryFixture(
  payload: Payload,
  fixture: Awaited<ReturnType<typeof seedLibraryFixture>>,
) {
  for (const resource of [...fixture.resources, fixture.draft])
    await payload.delete({ collection: 'library-resources', id: resource.id })
  await payload.delete({ collection: 'library-files', id: fixture.file.id })
  await payload.delete({ collection: 'library-topics', id: fixture.topic.id })
  await payload.delete({ collection: 'library-organizations', id: fixture.organization.id })
  for (const type of [fixture.education, fixture.guideline])
    await payload.delete({ collection: 'library-document-types', id: type.id })
  await payload.delete({ collection: 'users', id: fixture.user.id })
}
