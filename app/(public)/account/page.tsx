'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { consumerLocationLabel, formatLocationLine, normalizeServiceLocationType } from '@/lib/serviceLocation'

// ─── Vendor config ───────────────────────────────────────────────────────────
const VENDOR_CONFIG = { hasBookings: true, hasProducts: true } as const

// ─── Design tokens ───────────────────────────────────────────────────────────
const TEAL_DARK   = '#0D2B35'
const TEAL_INK    = '#112F3D'
const TEAL        = '#29C5CC'
const GOLD        = '#C9A84C'
const TEXT        = '#f0f9fa'
const MUTED       = 'rgba(240,249,250,0.5)'
const BORDER      = 'rgba(255,255,255,0.1)'
const CARD_BG     = 'rgba(255,255,255,0.05)'
const FONT_DISPLAY = 'Georgia, serif'
const FONT_BODY    = 'system-ui, sans-serif'

// ─── Types ───────────────────────────────────────────────────────────────────
type TabId = 'bookings' | 'orders' | 'rewards' | 'profile'

interface TabDef { id: TabId; label: string }
const ALL_TABS: TabDef[] = [
  { id: 'bookings', label: 'Bookings' },
  { id: 'orders',   label: 'Orders'   },
  { id: 'rewards',  label: 'Rewards'  },
  { id: 'profile',  label: 'Profile'  },
]

interface Order {
  id: string
  orderNumber?: string
  createdAt: string
  status: string
  total?: number
  shipment?: { trackingNumber?: string; carrier?: string } | null
  items?: { name: string; variantLabel?: string; quantity: number; price?: number }[]
}

interface Appointment {
  id: string
  bookingNumber?: string
  serviceName?: string
  service?: string
  scheduledAt?: string
  date?: string
  appointmentDate?: string
  durationMinutes?: number
  serviceDurationMinutes?: number
  price?: number
  totalPrice?: number
  status: string
  serviceLocationType?: string | null
  businessAddress?: string | null
  businessCity?: string | null
  businessState?: string | null
  alternateAddress?: string | null
  alternateCity?: string | null
  alternateState?: string | null
  alternateZipCode?: string | null
  virtualLink?: string | null
  customerServiceAddress?: string | null
  customerServiceCity?: string | null
  customerServiceState?: string | null
  customerServiceZipCode?: string | null
}

interface PointTransaction {
  id: string
  description: string
  createdAt: string
  points: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

const ORDER_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending:   { bg: 'rgba(158,158,158,0.15)', color: '#9E9E9E' },
  paid:      { bg: 'rgba(201,168,76,0.15)',  color: GOLD },
  shipped:   { bg: 'rgba(41,197,204,0.15)',  color: TEAL },
  delivered: { bg: 'rgba(76,175,80,0.15)',   color: '#4CAF50' },
  cancelled: { bg: 'rgba(220,38,38,0.15)',   color: '#DC2626' },
}

const UPCOMING_ORDER_STATUSES  = new Set(['pending', 'paid', 'shipped'])
const PAST_ORDER_STATUSES      = new Set(['delivered', 'cancelled'])
const UPCOMING_APPT_STATUSES   = new Set(['confirmed', 'pending'])
const PAST_APPT_STATUSES       = new Set(['completed', 'cancelled', 'no_show'])

const REDEMPTION_TIERS = [
  { pts: 2500,  dollars: 5   },
  { pts: 5000,  dollars: 10  },
  { pts: 12500, dollars: 25  },
  { pts: 25000, dollars: 50  },
  { pts: 50000, dollars: 100 },
]

// ─── Shared card wrapper ──────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: CARD_BG,
      border: `1px solid ${BORDER}`,
      borderRadius: 4,
      padding: '20px 24px',
      marginBottom: 16,
      ...style,
    }}>
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: '1.25rem', fontWeight: 500, color: TEXT, marginBottom: 16 }}>
      {children}
    </h3>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ imageUrl, initial, size = 56 }: { imageUrl?: string | null; initial: string; size?: number }) {
  if (imageUrl) {
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: TEAL, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: FONT_DISPLAY, fontSize: size * 0.42, fontWeight: 600, color: TEAL_DARK,
    }}>
      {initial}
    </div>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const colors = ORDER_STATUS_COLORS[status] ?? { bg: 'rgba(41,197,204,0.1)', color: TEAL }
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 12,
      fontSize: '0.68rem', letterSpacing: '.1em', textTransform: 'uppercase',
      fontFamily: FONT_BODY, fontWeight: 500,
      background: colors.bg, color: colors.color,
    }}>
      {status.replace('_', ' ')}
    </span>
  )
}

// ─── Bookings section ─────────────────────────────────────────────────────────
function BookingsSection() {
  const [appts, setAppts]     = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('outsyde_access_token') : null
    fetch('/api/consumer/appointments', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(data => setAppts(Array.isArray(data) ? data : data.appointments ?? []))
      .catch(() => setError('Failed to load bookings.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p style={{ color: MUTED, fontFamily: FONT_BODY, fontSize: '0.9rem' }}>Loading bookings…</p>
  if (error)   return <p style={{ color: '#fca5a5', fontFamily: FONT_BODY, fontSize: '0.9rem' }}>{error}</p>

  const upcoming = appts.filter(a => UPCOMING_APPT_STATUSES.has(a.status))
  const past     = appts.filter(a => PAST_APPT_STATUSES.has(a.status))

  if (appts.length === 0) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center' }}>
        <p style={{ fontFamily: FONT_DISPLAY, fontSize: '1.5rem', color: TEXT, marginBottom: 8 }}>No bookings yet</p>
        <p style={{ fontFamily: FONT_BODY, fontSize: '0.85rem', color: MUTED, marginBottom: 24 }}>
          Your booking history will appear here.
        </p>
        <a href="/book" style={{
          display: 'inline-block', background: TEAL, color: TEAL_DARK,
          padding: '12px 28px', fontSize: '0.72rem', letterSpacing: '.14em',
          textTransform: 'uppercase', textDecoration: 'none', borderRadius: 4,
          fontFamily: FONT_BODY, fontWeight: 700,
        }}>
          Book a Service
        </a>
      </div>
    )
  }

  return (
    <div>
      {upcoming.length > 0 && (
        <>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: '1.375rem', fontWeight: 500, color: TEXT, marginBottom: 16 }}>
            Upcoming
          </h2>
          {upcoming.map(a => <BookingCard key={a.id} appt={a} />)}
        </>
      )}
      {past.length > 0 && (
        <>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: '1.375rem', fontWeight: 500, color: TEXT, marginTop: upcoming.length > 0 ? 32 : 0, marginBottom: 16 }}>
            Past Bookings
          </h2>
          {past.map(a => <BookingCard key={a.id} appt={a} />)}
        </>
      )}
    </div>
  )
}

function BookingCard({ appt }: { appt: Appointment }) {
  const serviceName = appt.serviceName ?? appt.service ?? 'Service'
  const dateStr = appt.scheduledAt ?? appt.date ?? appt.appointmentDate
  const locType = normalizeServiceLocationType(appt.serviceLocationType)
  const confirmed = appt.status === 'confirmed' || appt.status === 'completed'
  let locationLine = consumerLocationLabel(locType)
  if (locType === 'customer') {
    locationLine = formatLocationLine([
      appt.customerServiceAddress,
      appt.customerServiceCity && appt.customerServiceState
        ? `${appt.customerServiceCity}, ${appt.customerServiceState}`
        : appt.customerServiceCity || appt.customerServiceState,
      appt.customerServiceZipCode,
    ]) || locationLine
  } else if (locType === 'alternate') {
    locationLine = formatLocationLine([
      appt.alternateAddress,
      appt.alternateCity && appt.alternateState
        ? `${appt.alternateCity}, ${appt.alternateState}`
        : appt.alternateCity || appt.alternateState,
      appt.alternateZipCode,
    ]) || locationLine
  } else if (locType === 'virtual') {
    locationLine = appt.virtualLink || locationLine
  } else if (confirmed) {
    locationLine = formatLocationLine([
      appt.businessAddress,
      appt.businessCity && appt.businessState
        ? `${appt.businessCity}, ${appt.businessState}`
        : appt.businessCity || appt.businessState,
    ]) || locationLine
  } else {
    locationLine = formatLocationLine([
      appt.businessCity && appt.businessState
        ? `${appt.businessCity}, ${appt.businessState}`
        : appt.businessCity || appt.businessState,
    ]) || 'Address shared after confirmation'
  }
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
        <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: '1.125rem', fontWeight: 500, color: TEXT }}>{serviceName}</h3>
        <span style={{ background: TEAL, color: TEAL_DARK, padding: '3px 10px', borderRadius: 12, fontSize: '0.68rem', letterSpacing: '.1em', textTransform: 'uppercase', fontFamily: FONT_BODY, fontWeight: 600 }}>
          {appt.status.replace('_', ' ')}
        </span>
      </div>
      {appt.bookingNumber && (
        <p style={{ fontFamily: FONT_BODY, fontSize: '0.75rem', color: MUTED, marginBottom: 4 }}>
          #{appt.bookingNumber}
        </p>
      )}
      {dateStr && (
        <p style={{ fontFamily: FONT_BODY, fontSize: '0.85rem', color: MUTED, marginBottom: 4 }}>
          {formatDate(dateStr)}
        </p>
      )}
      {(appt.durationMinutes != null || appt.serviceDurationMinutes != null || appt.price != null || appt.totalPrice != null) && (
        <p style={{ fontFamily: FONT_BODY, fontSize: '0.85rem', color: MUTED }}>
          {(appt.durationMinutes ?? appt.serviceDurationMinutes) != null && `${appt.durationMinutes ?? appt.serviceDurationMinutes} min`}
          {(appt.durationMinutes ?? appt.serviceDurationMinutes) != null && (appt.price != null || appt.totalPrice != null) && ' · '}
          {(appt.price != null || appt.totalPrice != null) && formatCents(appt.price ?? appt.totalPrice ?? 0)}
        </p>
      )}
      <p style={{ fontFamily: FONT_BODY, fontSize: '0.85rem', color: MUTED, marginTop: 6 }}>
        {locationLine}
      </p>
    </Card>
  )
}

// ─── Orders section ───────────────────────────────────────────────────────────
function OrdersSection() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('outsyde_access_token') : null
    fetch('/api/consumer/orders', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(data => setOrders(Array.isArray(data) ? data : data.orders ?? []))
      .catch(() => setError('Failed to load orders.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p style={{ color: MUTED, fontFamily: FONT_BODY, fontSize: '0.9rem' }}>Loading orders…</p>
  if (error)   return <p style={{ color: '#fca5a5', fontFamily: FONT_BODY, fontSize: '0.9rem' }}>{error}</p>

  const upcoming = orders.filter(o => UPCOMING_ORDER_STATUSES.has(o.status))
  const past     = orders.filter(o => PAST_ORDER_STATUSES.has(o.status))
  const other    = orders.filter(o => !UPCOMING_ORDER_STATUSES.has(o.status) && !PAST_ORDER_STATUSES.has(o.status))
  const allPast  = [...past, ...other]

  if (orders.length === 0) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center' }}>
        <p style={{ fontFamily: FONT_DISPLAY, fontSize: '1.5rem', color: TEXT, marginBottom: 8 }}>No orders yet</p>
        <p style={{ fontFamily: FONT_BODY, fontSize: '0.85rem', color: MUTED }}>
          Your order history will appear here.
        </p>
      </div>
    )
  }

  return (
    <div>
      {upcoming.length > 0 && (
        <>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: '1.375rem', fontWeight: 500, color: TEXT, marginBottom: 16 }}>
            Upcoming
          </h2>
          {upcoming.map(o => <OrderCard key={o.id} order={o} />)}
        </>
      )}
      {allPast.length > 0 && (
        <>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: '1.375rem', fontWeight: 500, color: TEXT, marginTop: upcoming.length > 0 ? 32 : 0, marginBottom: 16 }}>
            Past Orders
          </h2>
          {allPast.map(o => <OrderCard key={o.id} order={o} />)}
        </>
      )}
    </div>
  )
}

function OrderCard({ order }: { order: Order }) {
  const totalCents = order.total ?? 0
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
        <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: '1.125rem', fontWeight: 500, color: TEXT }}>
          Order #{order.id.slice(0, 8).toUpperCase()}
        </h3>
        <StatusBadge status={order.status} />
      </div>
      <p style={{ fontFamily: FONT_BODY, fontSize: '0.75rem', color: MUTED, marginBottom: order.items?.length ? 14 : 0 }}>
        {formatDateShort(order.createdAt)}
      </p>

      {order.items && order.items.length > 0 && (
        <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
          {order.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontFamily: FONT_BODY }}>
              <span style={{ color: TEXT }}>
                {item.name}
                {item.variantLabel && <span style={{ color: MUTED }}> · {item.variantLabel}</span>}
              </span>
              <span style={{ color: MUTED }}>×{item.quantity}</span>
            </div>
          ))}
        </div>
      )}

      {order.shipment?.trackingNumber && (
        <div style={{ background: 'rgba(201,168,76,0.07)', border: `1px solid rgba(201,168,76,0.2)`, borderRadius: 4, padding: '8px 12px', marginBottom: 12, fontFamily: FONT_BODY, fontSize: '0.8rem' }}>
          <span style={{ color: GOLD, fontWeight: 600 }}>
            {order.shipment.carrier ? `${order.shipment.carrier}: ` : 'Tracking: '}
          </span>
          <span style={{ color: TEXT }}>{order.shipment.trackingNumber}</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${BORDER}`, paddingTop: 12 }}>
        <span style={{ fontFamily: FONT_BODY, fontSize: '0.75rem', color: MUTED, textTransform: 'uppercase', letterSpacing: '.1em' }}>Total</span>
        <span style={{ fontFamily: FONT_BODY, fontSize: '1rem', fontWeight: 600, color: TEXT }}>{formatCents(totalCents)}</span>
      </div>
    </Card>
  )
}

// ─── Rewards section ──────────────────────────────────────────────────────────
function RewardsSection({ loyaltyPoints }: { loyaltyPoints: number }) {
  const [transactions, setTransactions] = useState<PointTransaction[]>([])
  const [txLoading, setTxLoading]       = useState(true)
  const [txStub, setTxStub]             = useState(false)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('outsyde_access_token') : null
    fetch('/api/consumer/points', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(data => {
        const txs = Array.isArray(data) ? data : (data.transactions ?? [])
        setTransactions(txs)
        if (txs.length === 0 && data.stub !== false) setTxStub(true)
      })
      .catch(() => setTxStub(true))
      .finally(() => setTxLoading(false))
  }, [])

  return (
    <div>
      {/* Balance card */}
      <div style={{ background: TEAL, borderRadius: 4, padding: '32px 24px', marginBottom: 16, textAlign: 'center' }}>
        <p style={{ fontFamily: FONT_BODY, fontSize: '0.688rem', letterSpacing: '.18em', textTransform: 'uppercase', color: TEAL_DARK, marginBottom: 8, fontWeight: 700 }}>
          YOUR BALANCE
        </p>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: '4.5rem', fontWeight: 600, color: TEAL_DARK, lineHeight: 1 }}>
          {loyaltyPoints}
        </div>
        <p style={{ fontFamily: FONT_BODY, fontSize: '0.875rem', color: 'rgba(13,43,53,0.65)', marginTop: 6 }}>
          loyalty points
        </p>
      </div>

      {/* How you earn */}
      <Card>
        <SectionTitle>How You Earn</SectionTitle>
        <p style={{ fontFamily: FONT_BODY, fontSize: '0.875rem', color: MUTED, lineHeight: 1.7 }}>
          Points are added automatically with every booking and purchase. The more you book, the more you save.
        </p>
      </Card>

      {/* What are points */}
      <Card>
        <SectionTitle>What Are Points?</SectionTitle>
        <p style={{ fontFamily: FONT_BODY, fontSize: '0.875rem', color: MUTED, lineHeight: 1.7 }}>
          Points accumulate with every transaction across all Outsyde-powered stores. Redeem them at checkout for a discount on your next service or purchase.
        </p>
      </Card>

      {/* Redemption tiers */}
      <Card>
        <SectionTitle>Redeem Your Points</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {REDEMPTION_TIERS.map(tier => {
            const available = loyaltyPoints >= tier.pts
            const needed    = tier.pts - loyaltyPoints
            return (
              <div key={tier.pts} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${BORDER}` }}>
                <div style={{ fontFamily: FONT_BODY, fontSize: '0.9rem' }}>
                  <span style={{ fontWeight: 700, color: TEXT }}>{tier.pts.toLocaleString()} pts</span>
                  <span style={{ color: MUTED }}> = ${tier.dollars} off</span>
                </div>
                {available ? (
                  <span style={{ fontFamily: FONT_BODY, fontSize: '0.8rem', color: '#4CAF50', fontWeight: 500 }}>✓ Available</span>
                ) : (
                  <span style={{ fontFamily: FONT_BODY, fontSize: '0.8rem', color: MUTED }}>
                    {needed.toLocaleString()} more needed
                  </span>
                )}
              </div>
            )
          })}
        </div>
        <p style={{ fontFamily: FONT_BODY, fontSize: '0.78rem', color: MUTED, marginTop: 16, lineHeight: 1.6 }}>
          Points are applied at checkout.
        </p>
      </Card>

      {/* Point history */}
      <Card>
        <SectionTitle>Point History</SectionTitle>
        {txLoading && (
          <p style={{ fontFamily: FONT_BODY, fontSize: '0.875rem', color: MUTED }}>Loading…</p>
        )}
        {!txLoading && txStub && (
          <p style={{ fontFamily: FONT_BODY, fontSize: '0.875rem', color: MUTED }}>Transaction history coming soon.</p>
        )}
        {!txLoading && !txStub && transactions.length === 0 && (
          <p style={{ fontFamily: FONT_BODY, fontSize: '0.875rem', color: MUTED }}>No transactions yet.</p>
        )}
        {!txLoading && transactions.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {transactions.map(tx => (
              <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${BORDER}` }}>
                <div>
                  <p style={{ fontFamily: FONT_BODY, fontSize: '0.875rem', color: TEXT }}>{tx.description}</p>
                  <p style={{ fontFamily: FONT_BODY, fontSize: '0.75rem', color: MUTED }}>{formatDateShort(tx.createdAt)}</p>
                </div>
                <span style={{ fontFamily: FONT_BODY, fontSize: '0.9rem', fontWeight: 600, color: tx.points >= 0 ? '#4CAF50' : '#DC2626' }}>
                  {tx.points >= 0 ? '+' : ''}{tx.points}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

// ─── Profile section ──────────────────────────────────────────────────────────
function ProfileSection() {
  const { user, logout, updateUser } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [displayName, setDisplayName]       = useState(user?.firstName ?? '')
  const [username, setUsername]             = useState(user?.username ?? '')
  const [identitySaving, setIdentitySaving] = useState(false)
  const [identityMsg, setIdentityMsg]       = useState<string | null>(null)
  const [photoUploading, setPhotoUploading] = useState(false)

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoUploading(true)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('outsyde_access_token') : null
      const form = new FormData()
      form.append('file', file)
      form.append('folder', 'profiles')
      const uploadRes = await fetch('/api/user/upload-image', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      })
      const { url } = await uploadRes.json()
      if (!url) throw new Error('No URL returned')
      const token2 = typeof window !== 'undefined' ? localStorage.getItem('outsyde_access_token') : null
      await fetch('/api/user/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token2 ? { Authorization: `Bearer ${token2}` } : {}),
        },
        body: JSON.stringify({ profileImageUrl: url }),
      })
      updateUser({ profileImageUrl: url })
    } catch {
      // silent — user will see no change in avatar
    } finally {
      setPhotoUploading(false)
    }
  }

  const handleIdentitySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIdentitySaving(true)
    setIdentityMsg(null)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('outsyde_access_token') : null
      const res = await fetch('/api/user/identity', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ displayName, username }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { message?: string }).message ?? 'Save failed')
      }
      updateUser({ firstName: displayName, username })
      setIdentityMsg('Changes saved.')
    } catch (err: unknown) {
      setIdentityMsg(err instanceof Error ? err.message : 'Failed to save. Please try again.')
    } finally {
      setIdentitySaving(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.06)', border: `1px solid ${BORDER}`,
    padding: '12px 14px', color: TEXT, fontSize: '1rem', outline: 'none',
    boxSizing: 'border-box', borderRadius: 4, fontFamily: FONT_BODY,
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.65rem', letterSpacing: '.14em', textTransform: 'uppercase',
    color: MUTED, marginBottom: 6, fontFamily: FONT_BODY,
  }

  const initial = user?.firstName?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <div>
      {/* Section 1 — Photo */}
      <Card>
        <SectionTitle>Profile Photo</SectionTitle>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Avatar imageUrl={user?.profileImageUrl} initial={initial} size={72} />
          <div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={photoUploading}
              style={{
                background: TEAL, color: TEAL_DARK, border: 'none', padding: '10px 20px',
                fontSize: '0.72rem', letterSpacing: '.12em', textTransform: 'uppercase',
                cursor: photoUploading ? 'not-allowed' : 'pointer', opacity: photoUploading ? 0.6 : 1,
                borderRadius: 4, fontFamily: FONT_BODY, fontWeight: 700,
              }}
            >
              {photoUploading ? 'Uploading…' : 'Change Photo'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handlePhotoChange}
            />
          </div>
        </div>
      </Card>

      {/* Section 2 — Account Info */}
      <Card>
        <SectionTitle>Account Info</SectionTitle>
        <form onSubmit={handleIdentitySubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              autoComplete="name"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              autoComplete="username"
              style={inputStyle}
            />
            <p style={{ fontFamily: FONT_BODY, fontSize: '0.75rem', color: MUTED, marginTop: 6 }}>
              Lowercase letters, numbers, underscores only. 14-day cooldown.
            </p>
          </div>
          {identityMsg && (
            <p style={{ fontFamily: FONT_BODY, fontSize: '0.85rem', color: identityMsg === 'Changes saved.' ? '#4CAF50' : '#fca5a5' }}>
              {identityMsg}
            </p>
          )}
          <div>
            <button
              type="submit"
              disabled={identitySaving}
              style={{
                background: TEAL, color: TEAL_DARK, border: 'none', padding: '11px 24px',
                fontSize: '0.72rem', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase',
                cursor: identitySaving ? 'not-allowed' : 'pointer', opacity: identitySaving ? 0.6 : 1,
                borderRadius: 4, fontFamily: FONT_BODY,
              }}
            >
              {identitySaving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Card>

      {/* Section 3 — Email */}
      <Card>
        <SectionTitle>Email Address</SectionTitle>
        <p style={{ fontFamily: FONT_BODY, fontSize: '0.9375rem', color: TEXT, marginBottom: 6 }}>
          {user?.email}
        </p>
        <p style={{ fontFamily: FONT_BODY, fontSize: '0.8rem', color: MUTED }}>
          To change your email address, contact{' '}
          <a href="mailto:braidswithlove757@gmail.com" style={{ color: TEAL, textDecoration: 'underline' }}>
            braidswithlove757@gmail.com
          </a>
        </p>
      </Card>

      {/* Section 4 — Password */}
      <Card>
        <SectionTitle>Password</SectionTitle>
        <p style={{ fontFamily: FONT_BODY, fontSize: '0.875rem', color: MUTED, marginBottom: 16, lineHeight: 1.6 }}>
          To change your password, we&apos;ll send a reset link to your email.
        </p>
        <Link
          href="/forgot-password"
          style={{
            display: 'inline-block', background: 'transparent',
            border: `1px solid ${TEAL}`, color: TEAL, padding: '10px 22px',
            fontSize: '0.72rem', fontWeight: 500, letterSpacing: '.14em',
            textTransform: 'uppercase', textDecoration: 'none',
            borderRadius: 4, fontFamily: FONT_BODY,
          }}
        >
          Reset Password
        </Link>
      </Card>

      {/* Sign out */}
      <button
        onClick={handleLogout}
        style={{
          width: '100%', background: 'transparent', border: `1px solid #DC2626`,
          color: '#DC2626', padding: '13px', fontSize: '0.72rem', fontWeight: 500,
          letterSpacing: '.14em', textTransform: 'uppercase', cursor: 'pointer',
          borderRadius: 4, fontFamily: FONT_BODY, marginTop: 8,
        }}
      >
        Sign Out
      </button>
    </div>
  )
}

// ─── Root page ────────────────────────────────────────────────────────────────
export default function AccountPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  const visibleTabs = ALL_TABS.filter(t =>
    (t.id !== 'bookings' || VENDOR_CONFIG.hasBookings) &&
    (t.id !== 'orders'   || VENDOR_CONFIG.hasProducts)
  )
  const defaultTab: TabId = 'bookings'
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login?redirect=/account')
    }
  }, [isLoading, user, router])

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: TEAL_DARK, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: MUTED, fontFamily: FONT_BODY, fontSize: '0.9rem' }}>Loading…</p>
      </div>
    )
  }

  if (!user) return null

  const initial = user.firstName?.[0]?.toUpperCase() ?? user.email[0].toUpperCase()

  return (
    <div style={{ minHeight: '100vh', background: TEAL_DARK }}>
      {/* Header */}
      <div style={{ background: TEAL_INK, paddingTop: 40, paddingBottom: 0 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px' }}>
          {/* Back link */}
          <Link
            href="/"
            style={{
              display: 'inline-block', marginBottom: 20,
              fontFamily: FONT_BODY, fontSize: '0.8125rem',
              color: MUTED, textDecoration: 'none',
            }}
          >
            ← Back to Home
          </Link>

          {/* Avatar + identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <Avatar imageUrl={user.profileImageUrl} initial={initial} size={56} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: FONT_DISPLAY, fontSize: '1.5rem', fontWeight: 500, color: TEXT, marginBottom: 2 }}>
                {user.firstName || user.email.split('@')[0]}
              </p>
              <p style={{ fontFamily: FONT_BODY, fontSize: '0.85rem', color: GOLD, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </p>
            </div>
            {/* Points badge */}
            <div style={{
              flexShrink: 0, border: `1px solid ${GOLD}`, borderRadius: 20,
              padding: '5px 14px', whiteSpace: 'nowrap',
            }}>
              <span style={{ fontFamily: FONT_BODY, fontSize: '0.8rem', color: GOLD }}>
                ✦ {(user.loyaltyPoints ?? 0).toLocaleString()} points
              </span>
            </div>
          </div>

          {/* Tab bar */}
          <div
            className="tab-scroll"
            style={{ display: 'flex', gap: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {visibleTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '11px 20px',
                  fontSize: '0.7rem', letterSpacing: '.14em', textTransform: 'uppercase',
                  fontFamily: FONT_BODY, fontWeight: activeTab === tab.id ? 600 : 400,
                  color: activeTab === tab.id ? TEXT : MUTED,
                  background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: activeTab === tab.id ? `2px solid ${TEAL}` : '2px solid transparent',
                  transition: 'color 0.15s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 64px' }}>
        {activeTab === 'bookings' && <BookingsSection />}
        {activeTab === 'orders'   && <OrdersSection />}
        {activeTab === 'rewards'  && <RewardsSection loyaltyPoints={user.loyaltyPoints ?? 0} />}
        {activeTab === 'profile'  && <ProfileSection />}
      </div>
    </div>
  )
}
