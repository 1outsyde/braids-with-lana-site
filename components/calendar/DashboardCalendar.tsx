'use client'

import { useState } from 'react'
import {
  DateMap,
  DayEntry,
  BookingEntry,
  BlockEntry,
  dotColors,
  BOOKING_STATUS_COLOR,
  BOOKING_STATUS_LABEL,
  BOOKING_STATUS_BADGE_BG,
  to12h,
  formatTimeRange,
} from '@/lib/calendar'

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function formatDateLabel(ds: string): string {
  const [y, m, d] = ds.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

const navBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: '#1C1008', fontSize: '1.4rem', lineHeight: 1,
  padding: '2px 10px', borderRadius: 4,
  minHeight: 36, minWidth: 36,
}

// ── Entry row (used in both list view and day panel) ─────────────────────────

function EntryRow({ entry, compact = false }: { entry: DayEntry; compact?: boolean }) {
  if (entry.type === 'blocked') {
    const block = entry as BlockEntry
    return (
      <div style={{
        background: 'rgba(192,57,43,0.07)', borderRadius: 8,
        padding: compact ? '5px 10px' : '8px 12px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ color: '#C0392B', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>✕</span>
        <span style={{ color: '#C0392B', fontSize: 13, wordBreak: 'break-word' }}>
          {block.title ?? block.reason ?? 'Blocked'}
          {compact && !block.isFullDay && block.startTime
            ? ` · ${to12h(block.startTime)}${block.endTime ? ` – ${to12h(block.endTime)}` : ''}`
            : null}
        </span>
      </div>
    )
  }

  const booking = entry as BookingEntry
  const color = BOOKING_STATUS_COLOR[booking.status] ?? '#888'
  const label = BOOKING_STATUS_LABEL[booking.status] ?? booking.status
  const badgeBg = BOOKING_STATUS_BADGE_BG[booking.status] ?? 'rgba(0,0,0,0.06)'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: compact ? '5px 0' : '8px 12px',
      background: compact ? 'transparent' : 'rgba(0,0,0,0.02)',
      borderRadius: compact ? 0 : 8,
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%', background: color,
        flexShrink: 0, display: 'inline-block',
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, color: '#1C1008', fontWeight: 500 }}>
          {booking.serviceName}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', marginTop: 2 }}>
          {booking.clientName}
          {compact
            ? ` · ${formatTimeRange(booking.startTime, booking.durationMinutes)}`
            : ` · ${booking.durationMinutes} min`}
        </div>
      </div>
      <span style={{
        fontSize: 11, padding: '3px 9px', borderRadius: 12,
        background: badgeBg, color, fontWeight: 600, letterSpacing: '.03em',
        whiteSpace: 'nowrap', flexShrink: 0,
        maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {label}
      </span>
    </div>
  )
}

// ── Day detail panel (full mode) ─────────────────────────────────────────────

function DayPanel({
  dateStr, entries, onClose,
}: {
  dateStr: string; entries: DayEntry[]; onClose: () => void
}) {
  const bookings = entries.filter(e => e.type === 'booking') as BookingEntry[]
  const fullDayBlocks = entries.filter(
    e => e.type === 'blocked' && (e as BlockEntry).isFullDay
  ) as BlockEntry[]
  const partialBlocks = entries.filter(
    e => e.type === 'blocked' && !(e as BlockEntry).isFullDay
  ) as BlockEntry[]

  return (
    <div style={{
      marginTop: 16, padding: '16px 20px',
      background: 'rgba(28,16,8,0.03)', borderRadius: 10,
      border: '1px solid rgba(28,16,8,0.09)',
      width: '100%', boxSizing: 'border-box',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 14,
      }}>
        <span style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: 17, fontWeight: 600, color: '#1C1008',
        }}>
          {formatDateLabel(dateStr)}
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(0,0,0,0.35)', fontSize: 20, lineHeight: 1,
            padding: '0 4px', minHeight: 36,
          }}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Bookings by start time */}
        {bookings.map((entry, i) => (
          <div key={i}>
            <div style={{
              fontSize: 12, color: 'rgba(0,0,0,0.4)',
              fontWeight: 500, marginBottom: 4,
            }}>
              {formatTimeRange(entry.startTime, entry.durationMinutes)}
            </div>
            <EntryRow entry={entry} />
          </div>
        ))}

        {/* Partial-day blocks with time context */}
        {partialBlocks.map((entry, i) => (
          <div key={i}>
            {entry.startTime && (
              <div style={{
                fontSize: 12, color: 'rgba(0,0,0,0.4)',
                fontWeight: 500, marginBottom: 4,
              }}>
                {to12h(entry.startTime)}
                {entry.endTime ? ` – ${to12h(entry.endTime)}` : ''}
              </div>
            )}
            <EntryRow entry={entry} />
          </div>
        ))}

        {/* Full-day blocks */}
        {fullDayBlocks.length > 0 && (
          <div>
            <div style={{
              fontSize: 12, color: 'rgba(0,0,0,0.4)',
              fontWeight: 500, marginBottom: 4,
            }}>
              All day
            </div>
            {fullDayBlocks.map((entry, i) => (
              <EntryRow key={i} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface DashboardCalendarProps {
  dateMap: DateMap
  mode: 'overview' | 'bookings' | 'full'
}

export default function DashboardCalendar({ dateMap, mode }: DashboardCalendarProps) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'month' | 'list'>('month')

  const todayStr = toDateStr(now.getFullYear(), now.getMonth(), now.getDate())

  function prev() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelectedDate(null)
  }

  function next() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelectedDate(null)
  }

  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = [
    ...Array.from<null>({ length: firstDow }).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const selectedEntries = selectedDate ? (dateMap[selectedDate] ?? []) : []

  const listEntries = Object.entries(dateMap)
    .filter(([, es]) => es.length > 0)
    .sort(([a], [b]) => a.localeCompare(b))

  const showToggle = mode === 'full' || mode === 'bookings'

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif' }}>
      {/* View toggle */}
      {showToggle && (
        <div style={{
          display: 'flex', gap: 0, marginBottom: 16,
          border: '1px solid rgba(0,0,0,0.1)',
          borderRadius: 8, overflow: 'hidden', width: 'fit-content',
        }}>
          {(['month', 'list'] as const).map((v, i) => (
            <button
              key={v}
              onClick={() => { setViewMode(v); setSelectedDate(null) }}
              style={{
                padding: '7px 20px', minHeight: 36, border: 'none',
                borderLeft: i > 0 ? '1px solid rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer', fontSize: 13,
                background: viewMode === v ? '#1C1008' : 'transparent',
                color: viewMode === v ? '#F5F5F5' : 'rgba(0,0,0,0.5)',
                fontWeight: viewMode === v ? 600 : 400,
                transition: 'all 0.15s',
                textTransform: 'capitalize',
              }}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* ── List view ── */}
      {viewMode === 'list' && (
        <div>
          <div style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 20, fontWeight: 600, color: '#1C1008', marginBottom: 16,
          }}>
            {MONTHS[month]} {year}
          </div>
          {listEntries.length === 0 ? (
            <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.4)', margin: 0 }}>
              No bookings to show.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {listEntries.map(([dateStr, entries]) => (
                <div key={dateStr}>
                  <div style={{
                    fontSize: 13, fontWeight: 600, color: '#1C1008',
                    marginBottom: 8, paddingBottom: 6,
                    borderBottom: '1px solid rgba(0,0,0,0.07)',
                  }}>
                    {formatDateLabel(dateStr)}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {entries.map((entry, i) => (
                      <EntryRow key={i} entry={entry} compact />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Month view ── */}
      {viewMode === 'month' && (
        <div>
          {/* Month nav */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: 12,
          }}>
            <button onClick={prev} style={navBtnStyle} aria-label="Previous month">‹</button>
            <span style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '1.1rem', fontWeight: 500, color: '#1C1008',
            }}>
              {MONTHS[month]} {year}
            </span>
            <button onClick={next} style={navBtnStyle} aria-label="Next month">›</button>
          </div>

          {/* Day-of-week headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
            {DAYS.map(d => (
              <div key={d} style={{
                textAlign: 'center', fontSize: 10,
                letterSpacing: '.08em', textTransform: 'uppercase',
                color: 'rgba(28,16,8,0.35)', padding: '2px 0',
              }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: 2 }}>
            {cells.map((day, idx) => {
              if (!day) return <div key={idx} style={{ padding: '6px 0' }} />

              const ds = toDateStr(year, month, day)
              const entries = dateMap[ds] ?? []
              const colors = dotColors(entries)
              const isToday = ds === todayStr
              const isSelected = ds === selectedDate
              const hasEntries = entries.length > 0
              const isClickable = hasEntries && mode !== 'overview'

              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', padding: '3px 0',
                  }}
                  onClick={() => {
                    if (!isClickable) return
                    setSelectedDate(isSelected ? null : ds)
                  }}
                >
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 28, height: 28, minWidth: 24, borderRadius: '50%',
                    background: isSelected ? '#E8630A' : isToday ? '#1C1008' : 'transparent',
                    color: isSelected || isToday ? '#F5F5F5' : '#1C1008',
                    fontSize: 13,
                    cursor: isClickable ? 'pointer' : 'default',
                    transition: 'background 0.12s',
                  }}>
                    {day}
                  </span>
                  {colors.length > 0 && (
                    <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                      {colors.map((c, i) => (
                        <span key={i} style={{
                          display: 'inline-block', width: 5, height: 5,
                          borderRadius: '50%', background: c, flexShrink: 0,
                        }} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Day detail panel — full mode only */}
          {mode === 'full' && selectedDate && selectedEntries.length > 0 && (
            <DayPanel
              dateStr={selectedDate}
              entries={selectedEntries}
              onClose={() => setSelectedDate(null)}
            />
          )}

          {/* Legend */}
          <div style={{
            display: 'flex', gap: 12, flexWrap: 'wrap',
            marginTop: 16, paddingTop: 12,
            borderTop: '1px solid rgba(0,0,0,0.07)',
          }}>
            {[
              { color: '#2D7A47', label: 'Confirmed' },
              { color: '#D4890A', label: 'Pending' },
              { color: '#C0392B', label: 'Blocked' },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{
                  display: 'inline-block', width: 7, height: 7,
                  borderRadius: '50%', background: color, flexShrink: 0,
                }} />
                <span style={{ fontSize: 11, color: 'rgba(28,16,8,0.5)', letterSpacing: '.04em' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
