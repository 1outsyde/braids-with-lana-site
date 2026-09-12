'use client'

import { useEffect, useState } from 'react'
import { buildDateMap, DateMap } from '@/lib/calendar'
import DashboardCalendar from '@/components/calendar/DashboardCalendar'
import { formatLocationLine } from '@/lib/serviceLocation'

// ── Types ────────────────────────────────────────────────────────────────────

type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'declined'

interface Booking {
  id: string
  bookingNumber: number
  status: BookingStatus
  service_name: string
  serviceName?: string
  customer_name: string
  customer_email: string
  appointment_date: string
  appointmentDate?: string
  appointment_time?: string
  appointmentTime?: string
  start_time?: string
  duration_minutes?: number
  notes?: string
  total_amount?: number
  created_at: string
  customerServiceAddress?: string | null
  customerServiceCity?: string | null
  customerServiceState?: string | null
  customerServiceZipCode?: string | null
  serviceLocationType?: string | null
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
  pending:   { bg: '#FEF3C7', color: '#92400E', label: 'Pending'   },
  confirmed: { bg: '#DBEAFE', color: '#1E40AF', label: 'Confirmed' },
  completed: { bg: '#D1FAE5', color: '#065F46', label: 'Completed' },
  cancelled: { bg: '#FEE2E2', color: '#991B1B', label: 'Cancelled' },
  declined:  { bg: '#F3F4F6', color: '#6B7280', label: 'Declined'  },
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtBookingNum(n: number) {
  return `#A${String(n).padStart(4, '0')}`
}

function fmtDate(dateStr: string | undefined | null) {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtTime(booking: Booking) {
  const t = booking.appointmentTime ?? booking.appointment_time ?? booking.start_time
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
  const [dateMap, setDateMap] = useState<DateMap>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  async function loadBookings() {
    setLoading(true)
    setError(null)
    try {
      const today = new Date().toISOString().substring(0, 10)
      const in90 = new Date(Date.now() + 90 * 864e5).toISOString().substring(0, 10)
      const q = filter ? `?status=${filter}` : ''
      const [bookingsRes, blocksRes] = await Promise.all([
        fetch(`/api/admin/bookings${q}`),
        fetch(`/api/admin/availability/blocks?startDate=${today}&endDate=${in90}`),
      ])
      if (!bookingsRes.ok) throw new Error('Failed to load bookings')
      const [bookingsData, blocksData] = await Promise.all([
        bookingsRes.json(),
        blocksRes.json().catch(() => ({})),
      ])
      const loaded = Array.isArray(bookingsData)
        ? bookingsData
        : (bookingsData.appointments ?? bookingsData.bookings ?? [])
      setBookings(loaded)
      setDateMap(buildDateMap(loaded, blocksData.blocks ?? blocksData.data ?? []))
    } catch {
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
    new Date((b.appointmentDate ?? b.appointment_date) + 'T00:00:00') >= new Date(today + 'T00:00:00')
  )
  const upNext = upcoming.sort((a, b) =>
    new Date((a.appointmentDate ?? a.appointment_date) + 'T00:00:00').getTime() - new Date((b.appointmentDate ?? b.appointment_date) + 'T00:00:00').getTime()
  )[0]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 38, fontWeight: 600, color: '#0D2B35', margin: 0, lineHeight: 1 }}>
            Bookings
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)', marginTop: 6 }}>
            Manage client appointments
          </p>
        </div>
        <button
          onClick={loadBookings}
          style={{ fontSize: 13, color: 'rgba(0,0,0,0.5)', background: 'transparent', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}
        >
          Refresh
        </button>
      </div>

      {/* Calendar — month/list toggle above bookings list */}
      <div style={{
        background: '#FFFFFF', borderRadius: 16,
        border: '1px solid rgba(0,0,0,0.07)', padding: '20px 24px', marginBottom: 28,
      }}>
        <DashboardCalendar dateMap={dateMap} mode="bookings" />
      </div>

      {/* Up Next card */}
      {upNext && (
        <div className="mb-8 p-5 rounded-2xl" style={{ background: '#FFFFFF', border: '1px solid rgba(201,168,76,0.25)', boxShadow: '0 2px 12px rgba(201,168,76,0.08)' }}>
          <div style={{ fontSize: 10, color: '#C9A84C', letterSpacing: '0.12em', marginBottom: 10, fontWeight: 700 }}>UP NEXT</div>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div style={{ fontSize: 20, fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, color: '#0D2B35' }}>
                {upNext.customer_name}
              </div>
              <div style={{ fontSize: 14, color: 'rgba(0,0,0,0.5)', marginTop: 3 }}>{upNext.serviceName ?? upNext.service_name}</div>
              <div style={{ fontSize: 13, color: '#0D2B35', marginTop: 6, fontWeight: 500 }}>
                {fmtDate(upNext.appointment_date ?? upNext.appointmentDate)}{fmtTime(upNext) ? ` · ${fmtTime(upNext)}` : ''}
              </div>
            </div>
            <div className="flex gap-2">
              {upNext.status === 'pending' && (
                <>
                  <ActionButton label="Accept" loading={actionLoading === upNext.id + 'confirmed'} onClick={() => updateStatus(upNext.id, 'confirmed')} primary />
                  <ActionButton label="Decline" loading={actionLoading === upNext.id + 'declined'} onClick={() => updateStatus(upNext.id, 'declined')} />
                </>
              )}
              {upNext.status === 'confirmed' && (
                <ActionButton label="Mark Complete" loading={actionLoading === upNext.id + 'completed'} onClick={() => updateStatus(upNext.id, 'completed')} primary />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filter tabs — underline pattern */}
      <div
        className="tab-scroll"
        style={{ display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.08)', marginBottom: 24, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            style={{
              fontSize: 13,
              padding: '10px 0',
              marginRight: 24,
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${filter === f.value ? '#C9A84C' : 'transparent'}`,
              marginBottom: -1,
              color: filter === f.value ? '#0D2B35' : 'rgba(0,0,0,0.45)',
              fontWeight: filter === f.value ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={loadBookings} />
      ) : bookings.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div className="flex flex-col gap-3">
          {bookings.map(b => {
            const st = STATUS_STYLE[b.status] ?? STATUS_STYLE.pending
            const time = fmtTime(b)
            return (
              <div
                key={b.id}
                className="rounded-2xl"
                style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', padding: '16px 20px' }}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span style={{ fontSize: 12, color: '#C9A84C', fontFamily: 'DM Mono, monospace', fontWeight: 500 }}>
                        {fmtBookingNum(b.bookingNumber)}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 10, background: st.bg, color: st.color, letterSpacing: '0.03em' }}>
                        {st.label.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: 17, fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, color: '#0D2B35' }}>
                      {b.customer_name}
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.5)', marginTop: 2 }}>{b.serviceName ?? b.service_name}</div>
                    {(b.customerServiceAddress || b.customerServiceCity) && (
                      <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginTop: 4 }}>
                        Client location: {formatLocationLine([
                          b.customerServiceAddress,
                          b.customerServiceCity && b.customerServiceState
                            ? `${b.customerServiceCity}, ${b.customerServiceState}`
                            : b.customerServiceCity || b.customerServiceState,
                          b.customerServiceZipCode,
                        ])}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.6)' }}>
                        {fmtDate(b.appointment_date ?? b.appointmentDate)}{time ? ` · ${time}` : ''}
                      </span>
                      {b.total_amount != null && (
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#C9A84C' }}>
                          {fmtMoney(b.total_amount)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 items-center flex-shrink-0 mt-1">
                    {b.status === 'pending' && (
                      <>
                        <ActionButton label="Accept" loading={actionLoading === b.id + 'confirmed'} onClick={() => updateStatus(b.id, 'confirmed')} primary small />
                        <ActionButton label="Decline" loading={actionLoading === b.id + 'declined'} onClick={() => updateStatus(b.id, 'declined')} small />
                      </>
                    )}
                    {b.status === 'confirmed' && (
                      <ActionButton label="Complete" loading={actionLoading === b.id + 'completed'} onClick={() => updateStatus(b.id, 'completed')} primary small />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
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
        padding: small ? '5px 14px' : '8px 20px',
        borderRadius: 8,
        border: '1px solid',
        borderColor: primary ? '#C9A84C' : 'rgba(0,0,0,0.15)',
        background: primary ? '#C9A84C' : 'transparent',
        color: primary ? '#0D0D0D' : 'rgba(0,0,0,0.55)',
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
    <div className="flex flex-col gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-2xl" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', padding: '20px 24px' }}>
          <div style={{ height: 12, width: 100, borderRadius: 4, background: 'rgba(0,0,0,0.06)', marginBottom: 10 }} />
          <div style={{ height: 18, width: 200, borderRadius: 4, background: 'rgba(0,0,0,0.08)', marginBottom: 8 }} />
          <div style={{ height: 12, width: 160, borderRadius: 4, background: 'rgba(0,0,0,0.05)' }} />
        </div>
      ))}
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl text-center" style={{ background: '#FFFFFF', border: '1px solid rgba(239,68,68,0.15)', padding: '48px 24px' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 22 }}>
        ⚠
      </div>
      <p style={{ fontSize: 14, color: '#991B1B', marginBottom: 20 }}>{message}</p>
      <button onClick={onRetry} style={{ fontSize: 13, padding: '7px 18px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', background: 'transparent', color: 'rgba(0,0,0,0.55)', cursor: 'pointer' }}>
        Try again
      </button>
    </div>
  )
}

function EmptyState({ filter }: { filter: string }) {
  return (
    <div className="rounded-2xl text-center" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', padding: '56px 24px' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 24 }}>
        ✂
      </div>
      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 600, color: '#0D2B35', marginBottom: 8 }}>
        {filter ? `No ${filter} bookings` : 'No bookings yet'}
      </div>
      <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.4)', margin: 0 }}>
        New appointments will appear here
      </p>
    </div>
  )
}
