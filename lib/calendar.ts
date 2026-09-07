export type BookingEntry = {
  type: 'booking'
  id: string
  bookingNumber: number
  status: string
  serviceName: string
  clientName: string
  startTime: string
  endTime: string
  durationMinutes: number
}

export type BlockEntry = {
  type: 'blocked'
  id: string
  reason: string | null
  title: string | null
  isFullDay: boolean
  startTime?: string
  endTime?: string
}

export type DayEntry = BookingEntry | BlockEntry

export type DateMap = Record<string, DayEntry[]>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawRecord = Record<string, any>

export function to12h(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

export function computeEndTime(startTime: string, durationMinutes: number): string {
  const [h, m] = startTime.split(':').map(Number)
  const totalMinutes = h * 60 + m + durationMinutes
  const endH = Math.floor(totalMinutes / 60) % 24
  const endM = totalMinutes % 60
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
}

export function formatTimeRange(startTime: string, durationMinutes: number): string {
  return `${to12h(startTime)} – ${to12h(computeEndTime(startTime, durationMinutes))}`
}

export const BOOKING_STATUS_COLOR: Record<string, string> = {
  confirmed:        '#2D7A47',
  completed:        '#2D7A47',
  pending_payment:  '#D4890A',
  pending_provider: '#D4890A',
  pending:          '#D4890A',
  canceled:         '#C0392B',
  cancelled:        '#C0392B',
  declined:         '#C0392B',
  no_show:          '#C0392B',
}

export const BOOKING_STATUS_LABEL: Record<string, string> = {
  confirmed:        'Confirmed',
  completed:        'Completed',
  pending_payment:  'Pending payment',
  pending_provider: 'Awaiting approval',
  pending:          'Pending',
  canceled:         'Canceled',
  cancelled:        'Cancelled',
  declined:         'Declined',
  no_show:          'No show',
}

export const BOOKING_STATUS_BADGE_BG: Record<string, string> = {
  confirmed:        'rgba(45,122,71,0.12)',
  completed:        'rgba(45,122,71,0.12)',
  pending_payment:  'rgba(212,137,10,0.12)',
  pending_provider: 'rgba(212,137,10,0.12)',
  pending:          'rgba(212,137,10,0.12)',
  canceled:         'rgba(192,57,43,0.10)',
  cancelled:        'rgba(192,57,43,0.10)',
  declined:         'rgba(192,57,43,0.10)',
  no_show:          'rgba(192,57,43,0.10)',
}

export function dotColor(entry: DayEntry): string {
  if (entry.type === 'blocked') return '#C0392B'
  return BOOKING_STATUS_COLOR[entry.status] ?? '#888'
}

export function dotColors(entries: DayEntry[]): string[] {
  const seen = new Set<string>()
  const colors: string[] = []
  for (const e of entries) {
    const c = dotColor(e)
    if (!seen.has(c)) { seen.add(c); colors.push(c) }
    if (colors.length >= 3) break
  }
  return colors
}

export function buildDateMap(
  appointments: RawRecord[],
  blocks: RawRecord[],
): DateMap {
  const map: DateMap = {}

  for (const appt of appointments) {
    const key = appt.appointment_date ?? appt.appointmentDate
    if (!key) continue
    if (!map[key]) map[key] = []
    const rawTime = appt.appointment_time ?? appt.appointmentTime ?? appt.start_time ?? '00:00'
    const startTime = String(rawTime).substring(0, 5)
    const duration = appt.duration_minutes ?? appt.durationMinutes ?? 60
    map[key].push({
      type: 'booking',
      id: appt.id,
      bookingNumber: appt.booking_number ?? appt.bookingNumber ?? 0,
      status: appt.status ?? 'pending',
      serviceName: appt.service_name ?? appt.serviceName ?? 'Appointment',
      clientName: appt.client_name ?? appt.clientName ?? appt.customer_name ?? appt.customerName ?? 'Client',
      startTime,
      endTime: computeEndTime(startTime, duration),
      durationMinutes: duration,
    })
  }

  for (const block of blocks) {
    const startAt = String(block.startAt ?? block.start_at ?? '')
    const datePart = startAt.substring(0, 10)
    if (!datePart) continue
    if (!map[datePart]) map[datePart] = []
    const startTimeStr = startAt.length > 10 ? startAt.substring(11, 16) : ''
    const isFullDay = !startTimeStr || startTimeStr === '00:00'
    const endAt = String(block.endAt ?? block.end_at ?? '')
    const endTimeStr = endAt.length > 10 ? endAt.substring(11, 16) : ''
    map[datePart].push({
      type: 'blocked',
      id: block.id,
      reason: block.reason ?? null,
      title: block.title ?? null,
      isFullDay,
      startTime: isFullDay ? undefined : (startTimeStr || undefined),
      endTime: isFullDay ? undefined : (endTimeStr || undefined),
    })
  }

  for (const key of Object.keys(map)) {
    map[key].sort((a, b) => {
      if (a.type === 'blocked' && b.type !== 'blocked') return 1
      if (a.type !== 'blocked' && b.type === 'blocked') return -1
      const aTime = a.type === 'booking' ? a.startTime : (a.startTime ?? '99:99')
      const bTime = b.type === 'booking' ? b.startTime : (b.startTime ?? '99:99')
      return aTime.localeCompare(bTime)
    })
  }

  return map
}
