/** Public routes shared by CMS SEO and server-side document references. */
export function documentPath(collection: string | undefined, slug?: string | null) {
  if (!slug || (collection !== 'pages' && collection !== 'posts')) return undefined
  return collection === 'posts'
    ? `/posts/${encodeURIComponent(slug)}`
    : slug === 'home'
      ? '/'
      : `/${encodeURIComponent(slug)}`
}
