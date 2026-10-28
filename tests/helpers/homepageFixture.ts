import type { Payload } from 'payload'
import type { Post } from '@/payload-types'

export function assertTestDatabase() {
  const name = new URL(process.env.DATABASE_URL || '').pathname
  if (!name.endsWith('_test') && !name.endsWith('-test'))
    throw new Error('Homepage fixtures require a dedicated *_test database.')
}

export const fixtureContext = { disableRevalidate: true }
export const demoContent: Post['content'] = {
  root: {
    type: 'root',
    version: 1,
    direction: 'ltr',
    format: '',
    indent: 0,
    children: [
      {
        type: 'paragraph',
        version: 1,
        direction: 'ltr',
        format: '',
        indent: 0,
        children: [
          {
            type: 'text',
            version: 1,
            text: 'სადემონსტრაციო ტექსტი ინტერფეისის შესამოწმებლად. სამედიცინო რეკომენდაციებს არ შეიცავს.',
            format: 0,
            detail: 0,
            mode: 'normal',
            style: '',
          },
        ],
      },
    ],
  },
}

export async function seedHomepageFixture(payload: Payload) {
  assertTestDatabase()
  const category = await payload.create({
    collection: 'categories',
    data: { title: 'კაროტიდი', slug: `homepage-e2e-topic-${Date.now()}` },
  })
  const titles = [
    'სადემონსტრაციო მასალა: კაროტიდული დაავადებების საკითხები',
    'სადემონსტრაციო მასალა: ქვედა კიდურის არტერიული დაავადებების თემატური მიმოხილვა',
    'სადემონსტრაციო მასალა: დიალიზის სისხლძარღვოვანი მიდგომის სასწავლო მიმოხილვა',
  ]
  const posts = []
  for (const [index, title] of titles.entries())
    posts.push(
      await payload.create({
        collection: 'posts',
        context: fixtureContext,
        data: {
          title,
          slug: `homepage-e2e-material-${Date.now()}-${index}`,
          content: demoContent,
          _status: 'published',
          categories: index === 0 ? [category.id] : [],
          meta: { description: 'სადემონსტრაციო აღწერა მხოლოდ ინტერფეისის შესამოწმებლად.' },
        },
      }),
    )
  const draft = await payload.create({
    collection: 'posts',
    context: fixtureContext,
    draft: true,
    data: {
      title: 'კაროტიდი — დაფარული სატესტო სტატია',
      slug: `homepage-e2e-draft-${Date.now()}`,
      content: demoContent,
      _status: 'draft',
    },
  })
  const home = await payload.create({
    collection: 'pages',
    context: fixtureContext,
    data: {
      title: 'VascHub — მთავარი',
      slug: 'home',
      hero: { type: 'none' },
      layout: [{ blockType: 'content', columns: [{ size: 'full' }] }],
      _status: 'published',
      homepage: {
        resources: posts.map((p) => p.id),
        academy: { post: posts[2].id },
        newsPosts: [posts[0].id, posts[1].id],
        events: [
          {
            title: 'სადემონსტრაციო შეხვედრა — განლაგების შემოწმება',
            date: '2027-01-15T10:00:00.000Z',
            location: 'სატესტო ადგილი',
            url: `/posts/${posts[0].slug}`,
          },
          {
            title: 'სადემონსტრაციო სემინარი — გრძელი ქართული სათაურის შემოწმება',
            url: `/posts/${posts[1].slug}`,
          },
        ],
      },
    },
  })
  return { category, posts, draft, home }
}

export async function cleanupHomepageFixture(
  payload: Payload,
  fixture: Awaited<ReturnType<typeof seedHomepageFixture>>,
) {
  await payload.delete({ collection: 'pages', id: fixture.home.id, context: fixtureContext })
  for (const post of [...fixture.posts, fixture.draft])
    await payload.delete({ collection: 'posts', id: post.id, context: fixtureContext })
  await payload.delete({ collection: 'categories', id: fixture.category.id })
}
