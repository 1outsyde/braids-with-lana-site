'use client'

import { DAY_NAMES, DayHours } from '@/lib/availability'
import { TIME_OPTIONS, to12h } from '@/lib/timeUtils'

interface Props {
  hours: DayHours[]
  onChange: (hours: DayHours[]) => void
  disabled?: boolean
}

export default function HoursEditor({ hours, onChange, disabled }: Props) {
  function update(index: number, patch: Partial<DayHours>) {
    const next = hours.map((h, i) => i === index ? { ...h, ...patch } : h)
    onChange(next)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {hours.map((day, i) => (
        <div
          key={day.dayOfWeek}
          style={{
            display: 'grid',
            gridTemplateColumns: '108px 1fr',
            alignItems: 'center',
            gap: 12,
            padding: '10px 0',
            borderBottom: i < hours.length - 1 ? '1px solid rgba(0,0,0,0.06)' : undefined,
          }}
        >
          {/* Day toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: disabled ? 'default' : 'pointer' }}>
            <input
              type="checkbox"
              checked={day.isActive}
              disabled={disabled}
              onChange={e => update(i, { isActive: e.target.checked })}
              style={{ accentColor: '#C9A84C', width: 16, height: 16, cursor: disabled ? 'default' : 'pointer' }}
            />
            <span style={{
              fontSize: 13, fontWeight: 500,
              color: day.isActive ? '#0D2B35' : 'rgba(0,0,0,0.3)',
            }}>
              {DAY_NAMES[day.dayOfWeek].slice(0, 3)}
            </span>
          </label>

          {/* Time selects or "Closed" */}
          {day.isActive ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TimeSelect
                value={to12h(day.startTime)}
                options={TIME_OPTIONS}
                disabled={disabled}
                onChange={v => update(i, { startTime: v })}
              />
              <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.35)' }}>to</span>
              <TimeSelect
                value={to12h(day.endTime)}
                options={TIME_OPTIONS}
                disabled={disabled}
                onChange={v => update(i, { endTime: v })}
              />
            </div>
          ) : (
            <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.3)', fontStyle: 'italic' }}>Closed</span>
          )}
        </div>
      ))}
    </div>
  )
}

function TimeSelect({
  value,
  options,
  disabled,
  onChange,
}: {
  value: string
  options: string[]
  disabled?: boolean
  onChange: (v: string) => void
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={e => onChange(e.target.value)}
      style={{
        fontSize: 13,
        padding: '5px 8px',
        borderRadius: 8,
        border: '1px solid rgba(0,0,0,0.14)',
        background: disabled ? 'rgba(0,0,0,0.04)' : '#fff',
        color: '#0D2B35',
        cursor: disabled ? 'default' : 'pointer',
        outline: 'none',
      }}
    >
      {options.map(o => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  )
}
