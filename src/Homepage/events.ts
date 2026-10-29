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
    .filter((event) => {
      if (!event.date) return true
      const date = new Date(event.date)
      if (!Number.isFinite(date.getTime())) return false

      // Date.parse otherwise silently turns e.g. February 30 into a March date.
      const calendar = /^(\d{4})-(\d{2})-(\d{2})(?:T|$)/.exec(event.date)
      if (calendar) {
        const [, year, month, dateOfMonth] = calendar
        const check = new Date(`${year}-${month}-${dateOfMonth}T00:00:00Z`)
        if (!Number.isFinite(check.getTime()) || check.getUTCDate() !== Number(dateOfMonth))
          return false
      }
      return day.format(date) >= today
    })
    .sort((a, b) => {
      if (!a.date) return b.date ? 1 : 0
      if (!b.date) return -1
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })
}
