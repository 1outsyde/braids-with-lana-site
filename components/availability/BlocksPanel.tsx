'use client'

import { useState } from 'react'
import MiniCalendar from './MiniCalendar'
import { BlockRow, formatBlockDate, isFullDayBlock } from '@/lib/availability'

interface Props {
  blocks: BlockRow[]
  onAdd: (payload: { startAt: string; endAt: string; isFullDay: boolean; reason?: string }) => Promise<void>
  onDelete: (id: string) => Promise<void>
  disabled?: boolean
}

export default function BlocksPanel({ blocks, onAdd, onDelete, disabled }: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [isFullDay, setIsFullDay] = useState(true)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const blockedSet = new Set(
    blocks
      .filter(b => isFullDayBlock(b.startAt, b.endAt))
      .map(b => b.startAt.slice(0, 10))
  )

  async function handleAdd() {
    if (!selectedDate) return
    setSaving(true)
    try {
      const startAt = isFullDay
        ? `${selectedDate}T00:00:00.000Z`
        : `${selectedDate}T${startTime}:00.000Z`
      const endAt = isFullDay
        ? `${selectedDate}T23:59:59.000Z`
        : `${selectedDate}T${endTime}:00.000Z`
      await onAdd({ startAt, endAt, isFullDay, reason: reason || undefined })
      setSelectedDate(null)
      setReason('')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    try { await onDelete(id) }
    finally { setDeleting(null) }
  }

  return (
    <div>
      {/* Calendar picker */}
      <div style={{
        background: '#fff', borderRadius: 14, border: '1px solid #e8f0f1',
        padding: '16px', marginBottom: 20,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0D2B35', marginBottom: 12 }}>
          Block a date
        </div>
        <MiniCalendar
          onSelect={d => setSelectedDate(d)}
          blockedDates={blockedSet}
          disabled={disabled || saving}
        />

        {selectedDate && (
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#0D2B35' }}>
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>

            {/* Full day toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
              <input
                type="checkbox"
                checked={isFullDay}
                onChange={e => setIsFullDay(e.target.checked)}
                style={{ accentColor: '#C9A84C' }}
              />
              Full day
            </label>

            {!isFullDay && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TimeInput value={startTime} onChange={setStartTime} />
                <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)' }}>to</span>
                <TimeInput value={endTime} onChange={setEndTime} />
              </div>
            )}

            <input
              type="text"
              placeholder="Reason (optional)"
              value={reason}
              onChange={e => setReason(e.target.value)}
              style={{
                fontSize: 13, padding: '7px 10px', borderRadius: 8,
                border: '1px solid rgba(0,0,0,0.14)', outline: 'none', color: '#0D2B35',
              }}
            />

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleAdd}
                disabled={saving || disabled}
                style={{
                  fontSize: 13, fontWeight: 600, padding: '7px 16px', borderRadius: 8,
                  background: '#C9A84C', color: '#fff', border: 'none',
                  cursor: saving || disabled ? 'default' : 'pointer',
                  opacity: saving || disabled ? 0.6 : 1,
                }}
              >
                {saving ? 'Saving…' : 'Block date'}
              </button>
              <button
                onClick={() => setSelectedDate(null)}
                style={{
                  fontSize: 13, padding: '7px 12px', borderRadius: 8,
                  background: 'transparent', border: '1px solid rgba(0,0,0,0.14)',
                  color: 'rgba(0,0,0,0.5)', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Existing blocks list */}
      <div style={{ fontSize: 13, fontWeight: 600, color: '#0D2B35', marginBottom: 10 }}>
        Upcoming blocked dates
      </div>
      {blocks.length === 0 ? (
        <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.4)', margin: 0 }}>No blocked dates.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {blocks.map(b => (
            <div
              key={b.id}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: 10,
                background: '#fff', border: '1px solid #e8f0f1',
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#0D2B35' }}>
                  {formatBlockDate(b.startAt, b.endAt)}
                </div>
                {b.reason && (
                  <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', marginTop: 2 }}>{b.reason}</div>
                )}
              </div>
              <button
                onClick={() => handleDelete(b.id)}
                disabled={deleting === b.id || disabled}
                style={{
                  fontSize: 12, color: '#c0392b', background: 'transparent', border: 'none',
                  cursor: deleting === b.id || disabled ? 'default' : 'pointer',
                  opacity: deleting === b.id ? 0.5 : 1,
                }}
              >
                {deleting === b.id ? '…' : 'Remove'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="time"
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        fontSize: 13, padding: '5px 8px', borderRadius: 8,
        border: '1px solid rgba(0,0,0,0.14)', outline: 'none', color: '#0D2B35',
      }}
    />
  )
}
