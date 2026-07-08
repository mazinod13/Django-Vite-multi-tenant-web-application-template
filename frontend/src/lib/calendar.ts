import { authFetch } from '@/lib/auth'

export type CalendarEvent = {
  id: string
  bs_year: number
  bs_month: number
  bs_day: number
  ad_date: string | null
  title: string
  title_np: string
  tithi: string
  category: 'holiday' | 'festival' | 'event'
  is_holiday: boolean
  source: 'seed' | 'tenant'
}

export type CalendarYear = {
  year: number
  months: Record<string, CalendarEvent[]>
}

// GET /api/calendar/<bsYear>/  -> events grouped by BS month
export async function fetchCalendarYear(bsYear: number): Promise<CalendarYear> {
  const res = await authFetch(`/calendar/${bsYear}/`)
  if (!res.ok) throw new Error('Failed to load calendar')
  return res.json()
}

// POST /api/calendar/events/  -> create a tenant event
export async function createCalendarEvent(
  payload: Pick<CalendarEvent, 'bs_year' | 'bs_month' | 'bs_day'> &
    Partial<Pick<CalendarEvent, 'title' | 'title_np' | 'category' | 'is_holiday'>>,
): Promise<CalendarEvent> {
  const res = await authFetch('/calendar/events/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(Object.values(data).flat().join(' ') || 'Failed to create event')
  }
  return res.json()
}
