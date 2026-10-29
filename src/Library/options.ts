export const resourceTypes = [
  { value: 'guideline', label: 'კლინიკური გაიდლაინი' },
  { value: 'publication', label: 'სამეცნიერო პუბლიკაცია' },
  { value: 'georgian', label: 'ქართული პროფესიული მასალა' },
  { value: 'education', label: 'სასწავლო დოკუმენტი' },
  { value: 'presentation', label: 'პრეზენტაცია' },
]

export const resourceLanguages = [
  { value: 'ka', label: 'ქართული' },
  { value: 'en', label: 'ინგლისური' },
  { value: 'ru', label: 'რუსული' },
  { value: 'other', label: 'სხვა' },
]

export function officialURL(value?: string | null): string | undefined {
  if (!value || /[\u0000-\u0020\\]/.test(value)) return undefined
  try {
    const url = new URL(value)
    if (url.protocol === 'https:' && !url.username && !url.password) return url.href
  } catch {
    /* Invalid URLs never become public actions. */
  }
  return undefined
}

export function validDOI(value?: string | null) {
  return Boolean(value && /^10\.\d{4,9}\/\S+$/i.test(value) && !/[<>"\\]/.test(value))
}

export function doiURL(value?: string | null) {
  return validDOI(value) ? `https://doi.org/${encodeURIComponent(value!)}` : undefined
}

export function resourceURL(resource: { slug: string }) {
  return `/library/${encodeURIComponent(resource.slug)}`
}

export function librarySlug(value: unknown) {
  return typeof value === 'string'
    ? value
        .normalize('NFC')
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, '')
    : ''
}
