/** Compare calendar dates in Georgia, including events near UTC midnight. */
export function upcomingEvents<T extends { date?: string | null }>(
  events: T[],
  now = new Date(),
): T[] {
  const day = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tbilisi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const today = day.format(now)
  return events
    .filter((event) => !event.date || day.format(new Date(event.date)) >= today)
    .sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'))
}
