import { to12h } from './timeUtils'

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export interface DayHours {
  dayOfWeek: number   // 0=Sun … 6=Sat
  isActive: boolean
  startTime: string   // "09:00" (24hr, as stored on backend)
  endTime: string     // "17:00"
}

export interface BlockRow {
  id: string
  providerType: string
  providerId: string
  startAt: string   // ISO timestamp
  endAt: string
  blockType: string
  reason: string | null
  title: string | null
  createdAt: string
}

export function getDefaultHours(): DayHours[] {
  return DAY_NAMES.map((_, i) => ({
    dayOfWeek: i,
    isActive: i >= 1 && i <= 5,   // Mon–Fri open by default
    startTime: '09:00',
    endTime: '17:00',
  }))
}

/** Backend returns rows only for active days; fill in closed days. */
export function fillWeekFromRows(rows: DayHours[]): DayHours[] {
  const byDay = new Map(rows.map(r => [r.dayOfWeek, r]))
  return DAY_NAMES.map((_, i) => byDay.get(i) ?? {
    dayOfWeek: i,
    isActive: false,
    startTime: '09:00',
    endTime: '17:00',
  })
}

export function isFullDayBlock(startAt: string, endAt: string): boolean {
  const s = new Date(startAt)
  const e = new Date(endAt)
  return s.getHours() === 0 && s.getMinutes() === 0 && e.getHours() === 23 && e.getMinutes() >= 59
}

export function formatBlockDate(startAt: string, endAt: string): string {
  const s = new Date(startAt)
  const e = new Date(endAt)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  if (isFullDayBlock(startAt, endAt)) {
    const sLabel = s.toLocaleDateString('en-US', opts)
    const eLabel = e.toLocaleDateString('en-US', opts)
    return sLabel === eLabel ? sLabel : `${sLabel} – ${eLabel}`
  }
  return `${s.toLocaleDateString('en-US', opts)}, ${to12h(
    `${String(s.getHours()).padStart(2,'0')}:${String(s.getMinutes()).padStart(2,'0')}`
  )} – ${to12h(`${String(e.getHours()).padStart(2,'0')}:${String(e.getMinutes()).padStart(2,'0')}`)}`
}
