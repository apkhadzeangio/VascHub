import type { Payload } from 'payload'
import sharp from 'sharp'
export function assertDirectoryTestDatabase() {
  const u = new URL(process.env.DATABASE_URL || '')
  if (
    !['postgres:', 'postgresql:'].includes(u.protocol) ||
    !['localhost', '127.0.0.1', '[::1]'].includes(u.hostname) ||
    u.pathname !== '/vaschub_directory_test'
  )
    throw new Error(
      'Directory fixtures require the local vaschub_directory_test database. Production is forbidden.',
    )
}
export async function seedDirectoryFixture(payload: Payload) {
  assertDirectoryTestDatabase()
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    credentials = {
      email: `synthetic-directory-${suffix}@vaschub.test`,
      password: 'synthetic-directory-local-only-123',
    }
  const user = await payload.create({
      collection: 'users',
      context: { bootstrapAdmin: true },
      data: { ...credentials, name: 'Synthetic directory fixture administrator' },
    }),
    editor = { ...user, collection: 'users' as const },
    access = { user: editor, overrideAccess: false } as const
  const summary =
    'სინთეტიკური სატესტო ჩანაწერი — არ წარმოადგენს რეალურ ექიმს ან ცენტრს. მხოლოდ ცნობარის ფუნქციური შემოწმებისთვის.'
  const centreBase = {
      slug: '',
      city: 'თბილისი',
      summary,
      directions: ['სინთეტიკური სისხლძარღვთა მიმართულება'],
    },
    centres = []
  for (let i = 0; i < 2; i++)
    centres.push(
      await payload.create({
        collection: 'centres',
        ...access,
        data: {
          ...centreBase,
          name: `სინთეტიკურიცნობარი — ცენტრი ${i === 0 ? 'გრძელი ქართული დასახელებით ფუნქციური ტესტირებისთვის' : 'ორი'}`,
          slug: `synthetic-centre-${suffix}-${i}`,
          city: i === 0 ? 'თბილისი' : 'ქუთაისი',
          address: 'სინთეტიკური მისამართი — რეალურ მისამართს არ წარმოადგენს',
          website: 'https://example.org/',
          email: 'synthetic-centre@example.test',
          phone: '+995 000 000 000',
          _status: 'published',
        },
      }),
    )
  const draftCentre = await payload.create({
    collection: 'centres',
    ...access,
    draft: true,
    data: {
      ...centreBase,
      name: 'დაფარულისინთეტიკურიცენტრი',
      slug: `synthetic-draft-centre-${suffix}`,
      city: 'დაფარულიქალაქი',
      email: 'draft-centre-secret@example.test',
      _status: 'draft',
    },
  })
  const pixels = await sharp({
    create: { width: 32, height: 32, channels: 3, background: '#cbd5e1' },
  })
    .png()
    .toBuffer()
  const media = await payload.create({
    collection: 'media',
    ...access,
    data: { alt: 'Synthetic neutral test image; no person depicted' },
    file: {
      data: pixels,
      mimetype: 'image/png',
      name: `synthetic-directory-${suffix}.png`,
      size: pixels.length,
    },
  })
  centres[0] = await payload.update({
    collection: 'centres',
    id: centres[0].id,
    ...access,
    data: { image: media.id },
  })
  const base = { slug: '', city: 'თბილისი', summary, specializations: ['სინთეტიკური ანგიოლოგია'] },
    specialists = []
  for (let i = 0; i < 13; i++)
    specialists.push(
      await payload.create({
        collection: 'specialists',
        ...access,
        data: {
          ...base,
          name: `სინთეტიკურიცნობარი ${String(i).padStart(2, '0')} — ${i === 0 ? 'გრძელი ქართული სახელისა და გვარის მქონე სატესტო პროფილი' : 'სატესტო სპეციალისტი'}`,
          slug: `synthetic-specialist-${suffix}-${i}`,
          _status: 'published',
          city: i === 1 ? 'ქუთაისი' : 'თბილისი',
          specializations: i === 1 ? ['სინთეტიკური ულტრაბგერა'] : base.specializations,
          centres:
            i === 0
              ? [centres[0].id, draftCentre.id]
              : i === 1
                ? [centres[1].id]
                : i === 12
                  ? []
                  : [centres[0].id],
          photo: i === 0 ? media.id : undefined,
          website: i === 0 ? 'https://example.org/synthetic-profile' : undefined,
          email: i === 0 ? 'synthetic-specialist@example.test' : undefined,
          phone: i === 0 ? '+995 000 000 001' : undefined,
          professionalLinks:
            i === 0
              ? [
                  {
                    label: 'სინთეტიკური პროფესიული ბმული',
                    url: 'https://example.org/synthetic-link',
                  },
                ]
              : [],
        },
      }),
    )
  const draft = await payload.create({
    collection: 'specialists',
    ...access,
    draft: true,
    data: {
      ...base,
      name: 'დაფარულისინთეტიკურისპეციალისტი',
      slug: `synthetic-draft-specialist-${suffix}`,
      city: 'დაფარულიქალაქი',
      specializations: ['დაფარულიმიმართულება'],
      centres: [centres[0].id],
      _status: 'draft',
    },
  })
  return {
    credentials,
    user,
    editor,
    centres,
    draftCentre,
    media,
    specialists,
    draft,
    base,
    centreBase,
    suffix,
  }
}
export async function cleanupDirectoryFixture(
  payload: Payload,
  f: Awaited<ReturnType<typeof seedDirectoryFixture>>,
) {
  assertDirectoryTestDatabase()
  for (const s of [...f.specialists, f.draft])
    await payload.delete({ collection: 'specialists', id: s.id })
  for (const c of [...f.centres, f.draftCentre])
    await payload.delete({ collection: 'centres', id: c.id })
  await payload.delete({ collection: 'media', id: f.media.id })
  await payload.delete({ collection: 'users', id: f.user.id })
}
