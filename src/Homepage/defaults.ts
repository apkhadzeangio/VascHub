export const homepageDefaults = {
  eyebrow: 'კლინიკური ცოდნა • პროფესიული ერთობა',
  heading: 'ცოდნა ყოველდღიური პრაქტიკისთვის.',
  intro: 'გაიდლაინები, სწავლა და პროფესიული შესაძლებლობები ერთ სივრცეში.',
  topics: [
    { label: 'აორტა', searchTerm: 'აორტა' },
    { label: 'კაროტიდი', searchTerm: 'კაროტიდი' },
    { label: 'პერიფერიული არტერიები', searchTerm: 'პერიფერიული არტერიები' },
    { label: 'ვენური დაავადებები', searchTerm: 'ვენური დაავადებები' },
    { label: 'დიალიზის მიდგომა', searchTerm: 'დიალიზი' },
    { label: 'დიაგნოსტიკა', searchTerm: 'დიაგნოსტიკა' },
  ],
  academy: {
    heading: 'ისწავლე მოკლე, პრაქტიკული მასალებით.',
    description: 'გაეცანი გამორჩეულ სასწავლო მასალას და გაიღრმავე ცოდნა.',
  },
}

/** Public links may be local paths or HTTP(S); never executable URLs or admin actions. */
export function publicHref(value?: string | null): string | undefined {
  if (!value || /[\u0000-\u0020\\]/.test(value)) return undefined
  if (/^\/(?!\/|(?:admin|api|next)(?:[/?#]|$))/.test(value)) return value
  try {
    const url = new URL(value)
    if ((url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password)
      return url.href
  } catch {
    // Unsupported or malformed input has no public action.
  }
  return undefined
}
