'use client'

import { useState } from 'react'

interface Props {
  /** Called when user clicks a date cell */
  onSelect: (date: string) => void
  /** Dates that are fully blocked — "YYYY-MM-DD" strings */
  blockedDates?: Set<string>
  disabled?: boolean
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function toYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function MiniCalendar({ onSelect, blockedDates = new Set(), disabled }: Props) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayYMD = toYMD(today)

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const monthLabel = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div style={{ userSelect: 'none' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button
          onClick={prevMonth}
          disabled={disabled}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#1C1008', fontSize: 16, padding: '2px 6px' }}
        >
          ‹
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#1C1008' }}>{monthLabel}</span>
        <button
          onClick={nextMonth}
          disabled={disabled}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#1C1008', fontSize: 16, padding: '2px 6px' }}
        >
          ›
        </button>
      </div>

      {/* Day labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {DAYS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 10, color: 'rgba(0,0,0,0.35)', fontWeight: 600 }}>{d}</div>
        ))}
      </div>

      {/* Cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((day, idx) => {
          if (!day) return <div key={`e${idx}`} />
          const ymd = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isBlocked = blockedDates.has(ymd)
          const isToday = ymd === todayYMD
          return (
            <button
              key={ymd}
              onClick={() => !disabled && onSelect(ymd)}
              disabled={disabled}
              title={isBlocked ? 'Blocked' : undefined}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: 28, borderRadius: 6, border: 'none',
                fontSize: 12, fontWeight: isToday ? 700 : 400,
                cursor: disabled ? 'default' : 'pointer',
                background: isBlocked ? 'rgba(245,197,24,0.18)' : isToday ? 'rgba(28,16,8,0.08)' : 'transparent',
                color: isBlocked ? '#8b6800' : '#1C1008',
                outline: isToday ? '1.5px solid rgba(28,16,8,0.2)' : undefined,
              }}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
