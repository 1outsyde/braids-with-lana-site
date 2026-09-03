'use client'

import { useEffect, useState } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'declined'

interface Booking {
  id: string
  booking_number: number
  status: BookingStatus
  service_name: string
  customer_name: string
  customer_email: string
  appointment_date: string
  appointment_time?: string
  start_time?: string
  duration_minutes?: number
  notes?: string
  total_amount?: number
  created_at: string
}

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Completed', value: 'completed' },
  { label: 'Declined', value: 'declined' },
  { label: 'Cancelled', value: 'cancelled' },
]

const STATUS_STYLE: Record<BookingStatus, { bg: string; color: string; label: string }> = {
  pending:   { bg: 'rgba(201,168,76,0.15)',  color: '#C9A84C', label: 'Pending'   },
  confirmed: { bg: 'rgba(41,197,204,0.15)',  color: '#29C5CC', label: 'Confirmed' },
  completed: { bg: 'rgba(34,197,94,0.15)',   color: '#4ADE80', label: 'Completed' },
  cancelled: { bg: 'rgba(239,68,68,0.15)',   color: '#F87171', label: 'Cancelled' },
  declined:  { bg: 'rgba(156,163,175,0.15)', color: '#9CA3AF', label: 'Declined'  },
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtBookingNum(n: number) {
  return `#A${String(n).padStart(4, '0')}`
}

function fmtDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtTime(booking: Booking) {
  const t = booking.appointment_time ?? booking.start_time
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

function fmtMoney(cents?: number) {
  if (!cents && cents !== 0) return null
  return `$${(cents / 100).toFixed(2)}`
}

// ── Component ────────────────────────────────────────────────────────────────

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selected, setSelected] = useState<Booking | null>(null)

  async function loadBookings() {
    setLoading(true)
    setError(null)
    try {
      const q = filter ? `?status=${filter}` : ''
      const res = await fetch(`/api/admin/bookings${q}`)
      if (!res.ok) throw new Error('Failed to load bookings')
      const data = await res.json()
      setBookings(Array.isArray(data) ? data : (data.appointments ?? data.bookings ?? []))
    } catch (e) {
      setError('Could not load bookings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadBookings() }, [filter])

  async function updateStatus(id: string, status: string) {
    setActionLoading(id + status)
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (!res.ok) throw new Error()
      setSelected(null)
      await loadBookings()
    } catch {
      alert('Action failed. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const today = new Date().toDateString()
  const upcoming = bookings.filter(b =>
    (b.status === 'pending' || b.status === 'confirmed') &&
    new Date(b.appointment_date) >= new Date(today)
  )
  const upNext = upcoming.sort((a, b) =>
    new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()
  )[0]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 600, color: '#F5F5F5', margin: 0 }}>
            Bookings
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(245,245,245,0.5)', marginTop: 4 }}>
            Manage client appointments
          </p>
        </div>
        <button
          onClick={loadBookings}
          style={{ fontSize: 13, color: '#29C5CC', background: 'transparent', border: '1px solid rgba(41,197,204,0.3)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}
        >
          Refresh
        </button>
      </div>

      {/* Up Next card */}
      {upNext && (
        <div className="mb-8 p-5 rounded-xl" style={{ background: 'rgba(41,197,204,0.07)', border: '1px solid rgba(41,197,204,0.2)' }}>
          <div style={{ fontSize: 11, color: '#29C5CC', letterSpacing: '0.08em', marginBottom: 10, fontWeight: 500 }}>UP NEXT</div>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div style={{ fontSize: 18, fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, color: '#F5F5F5' }}>
                {upNext.customer_name}
              </div>
              <div style={{ fontSize: 14, color: 'rgba(245,245,245,0.7)', marginTop: 3 }}>{upNext.service_name}</div>
              <div style={{ fontSize: 13, color: '#29C5CC', marginTop: 6 }}>
                {fmtDate(upNext.appointment_date)}{fmtTime(upNext) ? ` · ${fmtTime(upNext)}` : ''}
              </div>
            </div>
            <div className="flex gap-2">
              {upNext.status === 'pending' && (
                <>
                  <ActionButton
                    label="Accept"
                    loading={actionLoading === upNext.id + 'confirmed'}
                    onClick={() => updateStatus(upNext.id, 'confirmed')}
                    primary
                  />
                  <ActionButton
                    label="Decline"
                    loading={actionLoading === upNext.id + 'declined'}
                    onClick={() => updateStatus(upNext.id, 'declined')}
                  />
                </>
              )}
              {upNext.status === 'confirmed' && (
                <ActionButton
                  label="Mark Complete"
                  loading={actionLoading === upNext.id + 'completed'}
                  onClick={() => updateStatus(upNext.id, 'completed')}
                  primary
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status filters */}
      <div className="flex gap-2 flex-wrap mb-6">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            style={{
              fontSize: 13,
              padding: '5px 14px',
              borderRadius: 20,
              border: '1px solid',
              borderColor: filter === f.value ? '#29C5CC' : 'rgba(245,245,245,0.12)',
              background: filter === f.value ? 'rgba(41,197,204,0.12)' : 'transparent',
              color: filter === f.value ? '#29C5CC' : 'rgba(245,245,245,0.55)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={loadBookings} />
      ) : bookings.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(245,245,245,0.08)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                {['Booking', 'Client', 'Service', 'Date & Time', 'Amount', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: 'rgba(245,245,245,0.4)', fontWeight: 500, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.map((b, i) => {
                const st = STATUS_STYLE[b.status] ?? STATUS_STYLE.pending
                const time = fmtTime(b)
                return (
                  <tr
                    key={b.id}
                    style={{
                      borderTop: i > 0 ? '1px solid rgba(245,245,245,0.06)' : 'none',
                      background: 'transparent',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#29C5CC', fontFamily: 'DM Mono, monospace', whiteSpace: 'nowrap' }}>
                      {fmtBookingNum(b.booking_number)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: 13, color: '#F5F5F5', fontWeight: 500 }}>{b.customer_name}</div>
                      <div style={{ fontSize: 12, color: 'rgba(245,245,245,0.45)', marginTop: 2 }}>{b.customer_email}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: 'rgba(245,245,245,0.75)' }}>
                      {b.service_name}
                    </td>
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: 13, color: 'rgba(245,245,245,0.75)' }}>{fmtDate(b.appointment_date)}</div>
                      {time && <div style={{ fontSize: 12, color: 'rgba(245,245,245,0.45)', marginTop: 2 }}>{time}</div>}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: 'rgba(245,245,245,0.75)', whiteSpace: 'nowrap' }}>
                      {fmtMoney(b.total_amount) ?? '—'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 12, background: st.bg, color: st.color, letterSpacing: '0.04em' }}>
                        {st.label.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div className="flex gap-2 justify-end">
                        {b.status === 'pending' && (
                          <>
                            <ActionButton
                              label="Accept"
                              loading={actionLoading === b.id + 'confirmed'}
                              onClick={() => updateStatus(b.id, 'confirmed')}
                              primary
                              small
                            />
                            <ActionButton
                              label="Decline"
                              loading={actionLoading === b.id + 'declined'}
                              onClick={() => updateStatus(b.id, 'declined')}
                              small
                            />
                          </>
                        )}
                        {b.status === 'confirmed' && (
                          <ActionButton
                            label="Complete"
                            loading={actionLoading === b.id + 'completed'}
                            onClick={() => updateStatus(b.id, 'completed')}
                            primary
                            small
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────────

function ActionButton({
  label, loading, onClick, primary = false, small = false,
}: {
  label: string; loading?: boolean; onClick: () => void; primary?: boolean; small?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        fontSize: small ? 12 : 13,
        padding: small ? '4px 12px' : '7px 18px',
        borderRadius: 8,
        border: '1px solid',
        borderColor: primary ? '#C9A84C' : 'rgba(245,245,245,0.2)',
        background: primary ? '#C9A84C' : 'transparent',
        color: primary ? '#0D0D0D' : 'rgba(245,245,245,0.7)',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.6 : 1,
        fontWeight: primary ? 600 : 400,
        whiteSpace: 'nowrap',
        transition: 'all 0.15s',
      }}
    >
      {loading ? '…' : label}
    </button>
  )
}

function LoadingSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(245,245,245,0.08)' }}>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-4" style={{ borderTop: i > 0 ? '1px solid rgba(245,245,245,0.06)' : 'none' }}>
          {[60, 140, 120, 140, 60, 80].map((w, j) => (
            <div key={j} style={{ height: 14, width: w, borderRadius: 4, background: 'rgba(255,255,255,0.07)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ))}
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-xl p-10 text-center" style={{ border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.04)' }}>
      <p style={{ color: '#F87171', marginBottom: 16 }}>{message}</p>
      <button onClick={onRetry} style={{ fontSize: 13, color: '#29C5CC', background: 'transparent', border: '1px solid rgba(41,197,204,0.3)', borderRadius: 8, padding: '6px 16px', cursor: 'pointer' }}>
        Try again
      </button>
    </div>
  )
}

function EmptyState({ filter }: { filter: string }) {
  return (
    <div className="rounded-xl p-14 text-center" style={{ border: '1px solid rgba(245,245,245,0.08)' }}>
      <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>✂</div>
      <p style={{ fontSize: 15, color: 'rgba(245,245,245,0.5)', margin: 0 }}>
        {filter ? `No ${filter} bookings` : 'No bookings yet'}
      </p>
      <p style={{ fontSize: 13, color: 'rgba(245,245,245,0.3)', marginTop: 6 }}>
        New appointments will appear here
      </p>
    </div>
  )
}