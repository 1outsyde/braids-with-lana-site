'use client'
import { useState, useEffect, useRef, useCallback, Suspense, type ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import { useWindowWidth } from '@/lib/useWindowWidth'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import {
  consumerLocationLabel,
  customerAddressComplete,
  customerAddressPayload,
  formatLocationLine,
  normalizeServiceLocationType,
  type ServiceLocationType,
} from '@/lib/serviceLocation'
import { formatDuration } from '@/lib/outsyde'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// ─── Types ───────────────────────────────────────────────────────────────────

interface Addon {
  id: string
  name: string
  description?: string | null
  priceCents: number
  durationMinutes: number | null
}

interface Service {
  id: string
  name: string
  description?: string
  price: number
  durationMinutes: number
  category?: string
  isActive: boolean
  depositAmountCents?: number | null
  serviceLocationType?: ServiceLocationType | null
  alternateAddress?: string | null
  alternateCity?: string | null
  alternateState?: string | null
  alternateZipCode?: string | null
  virtualLink?: string | null
  addons?: Addon[]
}

interface PublicBusiness {
  name?: string
  address?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  showAddress?: boolean | null
}

interface Slot {
  startTime: string
  endTime: string
  available: boolean
}

interface BookingConfirmation {
  bookingNumber: string
  appointmentId: string
}

interface HoldData {
  servicePriceCents: number | null
  dueNowCents: number | null
  inPersonDueCents: number | null
  totalPriceCents: number | null
  depositAmountCents: number | null
  dueNowFeeCents: number | null
  durationMinutes: number | null
  startTime: string | null
  endTime: string | null
  addons: Array<{ id: string; name: string; priceCents: number; durationMinutes: number }>
  depositNonRefundable: boolean
}

type Step = 'service' | 'datetime' | 'auth' | 'addons' | 'payment' | 'confirm'

// ─── Design tokens ───────────────────────────────────────────────────────────

const T = {
  teal: '#E8630A',
  tealLight: '#a0d8db',
  navy: '#1C1008',
  gold: '#F5C518',
  muted: '#7A5C4A',
  border: '#d1dce0',
  bg: '#FFFAF5',
  card: '#fff',
  error: '#c53030',
  errorBg: '#fff5f5',
  errorBorder: '#fed7d7',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '11px 14px',
  border: `1px solid ${T.border}`,
  borderRadius: 6,
  fontSize: 16,
  color: T.navy,
  outline: 'none',
  fontFamily: "'DM Sans', sans-serif",
  background: '#fff',
}

const btnPrimary = (disabled = false): React.CSSProperties => ({
  width: '100%',
  background: disabled ? T.tealLight : T.teal,
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  padding: '13px',
  fontSize: 14,
  fontWeight: 600,
  cursor: disabled ? 'not-allowed' : 'pointer',
  letterSpacing: '0.04em',
  fontFamily: "'DM Sans', sans-serif",
})

const btnSecondary: React.CSSProperties = {
  background: 'transparent',
  color: T.teal,
  border: `1px solid ${T.teal}`,
  borderRadius: 6,
  padding: '11px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: "'DM Sans', sans-serif",
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

const STEPS: Step[] = ['service', 'datetime', 'auth', 'addons', 'payment', 'confirm']
const STEP_LABELS = ['Service', 'Date & Time', 'Account', 'Add-ons', 'Review & Pay', 'Confirmed']
const STEP_LABELS_MOBILE = ['Svc', 'Date', 'Acct', 'Add-ons', 'Pay', 'Done']

function ProgressBar({ step }: { step: Step }) {
  const isMobile = useWindowWidth() < 480
  const labels = isMobile ? STEP_LABELS_MOBILE : STEP_LABELS
  const idx = STEPS.indexOf(step)
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: i <= idx ? T.teal : '#e2eaed',
              color: i <= idx ? '#fff' : T.muted,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700,
            }}>
              {i < idx ? '✓' : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: i < idx ? T.teal : '#e2eaed', margin: '0 4px' }} />
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        {labels.map((label, i) => (
          <span key={label} style={{ fontSize: 10, color: i <= idx ? T.teal : T.muted, fontWeight: i === idx ? 700 : 400, width: isMobile ? 40 : 60, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Step 1: Service picker ───────────────────────────────────────────────────

function ServiceStep({ onSelect, allowPreselect }: { onSelect: (s: Service) => void; allowPreselect: boolean }) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const preselectId = allowPreselect ? searchParams.get('serviceId') : null

  useEffect(() => {
    fetch('/api/bookings/services')
      .then(r => r.json())
      .then(data => {
        const list: Service[] = Array.isArray(data) ? data : (data.services ?? [])
        setServices(list.filter((s: Service) => s.isActive))
        setLoading(false)
      })
      .catch(() => { setError('Could not load services. Please refresh.'); setLoading(false) })
  }, [])

  useEffect(() => {
    if (!preselectId || loading) return
    const match = services.find(s => s.id === preselectId)
    if (match) onSelect(match)
  }, [preselectId, loading, services, onSelect])

  if (loading) return <p style={{ textAlign: 'center', color: T.muted, padding: 40 }}>Loading services…</p>
  if (error) return <p style={{ textAlign: 'center', color: T.error, padding: 40 }}>{error}</p>

  return (
    <div>
      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: T.navy, marginBottom: 20, marginTop: 0 }}>
        Choose a Service
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {services.map(service => (
          <button
            key={service.id}
            onClick={() => onSelect(service)}
            style={{
              background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8,
              padding: '16px 20px', cursor: 'pointer', textAlign: 'left', width: '100%',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = T.teal)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: T.navy, fontSize: 15, marginBottom: 4 }}>{service.name}</div>
                {service.description && (
                  <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.5 }}>{service.description}</div>
                )}
                <div style={{ fontSize: 12, color: T.muted, marginTop: 6 }}>
                  {formatDuration(service.durationMinutes) ? `${formatDuration(service.durationMinutes)} · ` : ''}{consumerLocationLabel(service.serviceLocationType)}
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 16, color: T.gold, marginLeft: 16, flexShrink: 0 }}>
                ${(service.price / 100).toFixed(2)}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Step 2: Date + Time picker ───────────────────────────────────────────────

function DateTimeStep({
  service,
  addonIds,
  onSelect,
  onBack,
}: {
  service: Service
  addonIds: string[]
  onSelect: (date: string, slot: Slot) => void
  onBack: () => void
}) {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotsError, setSlotsError] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)

  const fetchSlots = useCallback((d: string) => {
    setLoadingSlots(true)
    setSlotsError(null)
    setSelectedSlot(null)
    const timeAddingIds = addonIds.filter(id => {
      const a = (service.addons ?? []).find(x => x.id === id)
      return a && (a.durationMinutes ?? 0) > 0
    })
    const params = new URLSearchParams({ date: d, serviceDurationMinutes: String(service.durationMinutes), serviceId: service.id })
    if (timeAddingIds.length > 0) params.set('addonIds', timeAddingIds.join(','))
    fetch(`/api/bookings/availability?${params}`)
      .then(r => r.json())
      .then(data => {
        const list: Slot[] = Array.isArray(data) ? data : (data.slots ?? [])
        setSlots(list)
        setLoadingSlots(false)
      })
      .catch(() => { setSlotsError('Could not load availability.'); setLoadingSlots(false) })
  }, [service.durationMinutes, service.id, service.addons, addonIds])

  useEffect(() => { fetchSlots(date) }, [date, fetchSlots])

  const availableSlots = slots.filter(s => s.available)

  function formatTime(t: string) {
    const [h, m] = t.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
  }

  return (
    <div>
      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: T.navy, marginBottom: 4, marginTop: 0 }}>
        Pick a Date & Time
      </h2>
      <p style={{ color: T.muted, fontSize: 13, marginBottom: 20 }}>{service.name}{formatDuration(service.durationMinutes) ? ` · ${formatDuration(service.durationMinutes)}` : ''}</p>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 6 }}>Date</label>
        <input
          type="date"
          value={date}
          min={today}
          onChange={e => setDate(e.target.value)}
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 10 }}>Available Times</label>
        {loadingSlots && <p style={{ color: T.muted, fontSize: 13 }}>Loading…</p>}
        {slotsError && <p style={{ color: T.error, fontSize: 13 }}>{slotsError}</p>}
        {!loadingSlots && !slotsError && availableSlots.length === 0 && (
          <p style={{ color: T.muted, fontSize: 13 }}>No availability on this date. Try another day.</p>
        )}
        {!loadingSlots && availableSlots.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {availableSlots.map(slot => {
              const active = selectedSlot?.startTime === slot.startTime
              return (
                <button
                  key={slot.startTime}
                  onClick={() => setSelectedSlot(slot)}
                  style={{
                    padding: '10px 4px', borderRadius: 6, fontSize: 13,
                    border: `1px solid ${active ? T.teal : T.border}`,
                    background: active ? T.teal : '#fff',
                    color: active ? '#fff' : T.navy,
                    fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {formatTime(slot.startTime)}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={onBack} style={{ ...btnSecondary, flex: 1 }}>Back</button>
        <button
          onClick={() => selectedSlot && onSelect(date, selectedSlot)}
          disabled={!selectedSlot}
          style={{ ...btnPrimary(!selectedSlot), flex: 2 }}
        >
          Continue
        </button>
      </div>
    </div>
  )
}

// ─── Step 4: Add-ons upsell ───────────────────────────────────────────────────

function AddOnsStep({
  service,
  selectedAddonIds,
  customerDetails,
  date,
  slot,
  onSelect,
  onBack,
}: {
  service: Service
  selectedAddonIds: string[]
  customerDetails: string
  date: string
  slot: Slot
  onSelect: (addonIds: string[], details: string) => void
  onBack: () => void
}) {
  const allAddons = service.addons ?? []
  const [addonIds, setAddonIds] = useState<string[]>(selectedAddonIds)
  const [details, setDetails] = useState(customerDetails)
  const [checking, setChecking] = useState<Record<string, boolean>>({})
  const [fitErrors, setFitErrors] = useState<Record<string, string | null>>({})
  const MAX_ADDONS = 10
  const atMax = addonIds.length >= MAX_ADDONS

  async function toggleAddon(addon: Addon) {
    const id = addon.id
    if (addonIds.includes(id)) {
      setAddonIds(prev => prev.filter(x => x !== id))
      setFitErrors(prev => ({ ...prev, [id]: null }))
      return
    }
    if (addonIds.length >= MAX_ADDONS) return

    // Time-adding add-on: check fit before committing
    if ((addon.durationMinutes ?? 0) > 0) {
      setChecking(prev => ({ ...prev, [id]: true }))
      try {
        const wouldBeIds = [...addonIds, id]
        const params = new URLSearchParams({
          date,
          serviceDurationMinutes: String(service.durationMinutes),
          serviceId: service.id,
          addonIds: wouldBeIds.join(','),
        })
        const res = await fetch(`/api/bookings/availability?${params}`)
        if (!res.ok) throw new Error('network')
        const data = await res.json()
        const slots: Slot[] = Array.isArray(data) ? data : (data.slots ?? [])
        const fits = slots.some(s => s.available && s.startTime === slot.startTime)
        if (!fits) {
          const addMins = addon.durationMinutes ?? 0
          function fmtTime(t: string) {
            const [h, m] = t.split(':').map(Number)
            return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
          }
          setFitErrors(prev => ({ ...prev, [id]: `Needs ${addMins} more minute${addMins !== 1 ? 's' : ''} — not available at ${fmtTime(slot.startTime)}.` }))
          setChecking(prev => ({ ...prev, [id]: false }))
          return
        }
        setFitErrors(prev => ({ ...prev, [id]: null }))
        setAddonIds(prev => [...prev, id])
      } catch {
        setFitErrors(prev => ({ ...prev, [id]: 'Could not verify availability. Please try again.' }))
      } finally {
        setChecking(prev => ({ ...prev, [id]: false }))
      }
    } else {
      setFitErrors(prev => ({ ...prev, [id]: null }))
      setAddonIds(prev => [...prev, id])
    }
  }

  const selectedAddons = allAddons.filter(a => addonIds.includes(a.id))
  const subtotalCents = service.price + selectedAddons.reduce((s, a) => s + a.priceCents, 0)

  return (
    <div>
      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: T.navy, marginBottom: 20, marginTop: 0 }}>
        Add-ons
      </h2>

      {/* Summary card */}
      <div style={{ background: '#FFF8F2', border: `1px solid #c8e8ea`, borderRadius: 8, padding: '14px 18px', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: selectedAddons.length > 0 ? 8 : 0 }}>
          <span style={{ fontSize: 14, color: T.navy }}>{service.name}</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: T.navy }}>${(service.price / 100).toFixed(2)}</span>
        </div>
        {selectedAddons.map(a => (
          <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 13, color: T.muted }}>+ {a.name}</span>
            <span style={{ fontSize: 13, color: T.muted }}>+${(a.priceCents / 100).toFixed(2)}</span>
          </div>
        ))}
        <div style={{ borderTop: `1px solid #c8e8ea`, marginTop: selectedAddons.length > 0 ? 8 : 4, paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>Subtotal (before fees)</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.teal }}>${(subtotalCents / 100).toFixed(2)}</span>
        </div>
        <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>Final amount on the next screen.</div>
      </div>

      {allAddons.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          {atMax && (
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 8 }}>Maximum {MAX_ADDONS} add-ons selected.</div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {allAddons.map(addon => {
              const checked = addonIds.includes(addon.id)
              const isChecking = checking[addon.id]
              const disabled = (!checked && atMax) || isChecking
              const fitError = fitErrors[addon.id]
              return (
                <div key={addon.id}>
                  <label
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                      background: checked ? '#FFF8F2' : '#fff',
                      border: `1px solid ${checked ? T.teal : fitError ? T.errorBorder : T.border}`,
                      borderRadius: 8, padding: '12px 14px',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      opacity: disabled && !isChecking ? 0.5 : 1,
                      transition: 'all 0.15s',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggleAddon(addon)}
                      style={{ accentColor: T.teal, width: 16, height: 16, flexShrink: 0, marginTop: 2 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: T.navy }}>{addon.name}</div>
                      {addon.description && (
                        <div style={{ fontSize: 12, color: T.muted, marginTop: 2, lineHeight: 1.4 }}>{addon.description}</div>
                      )}
                      {(addon.durationMinutes ?? 0) > 0 && (
                        <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>+{addon.durationMinutes} min</div>
                      )}
                      {isChecking && (
                        <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>Checking availability…</div>
                      )}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.teal, flexShrink: 0 }}>
                      +${(addon.priceCents / 100).toFixed(2)}
                    </div>
                  </label>
                  {fitError && (
                    <div style={{ fontSize: 12, color: T.error, marginTop: 6, paddingLeft: 4, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span>{fitError}</span>
                      <button
                        onClick={onBack}
                        style={{ background: 'none', border: 'none', color: T.teal, fontWeight: 600, cursor: 'pointer', fontSize: 12, padding: 0, textDecoration: 'underline' }}
                      >
                        Change time
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 6 }}>
          {allAddons.length === 0 ? 'Anything we should know?' : 'Notes'} <span style={{ color: T.muted, fontWeight: 400 }}>(optional)</span>
        </label>
        <textarea
          value={details}
          onChange={e => setDetails(e.target.value)}
          placeholder="Custom letters, design ideas, anything we should know (optional)"
          rows={3}
          maxLength={1000}
          style={{ ...inputStyle, height: 'auto', resize: 'vertical', padding: '11px 14px', lineHeight: 1.5 }}
        />
        <div style={{ fontSize: 11, color: T.muted, textAlign: 'right', marginTop: 4 }}>{details.length}/1000</div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={onBack} style={{ ...btnSecondary, flex: 1 }}>Back</button>
        <button onClick={() => onSelect(addonIds, details)} style={{ ...btnPrimary(), flex: 2 }}>
          Continue
        </button>
      </div>
    </div>
  )
}

// ─── Step 3: Auth gate ────────────────────────────────────────────────────────

function AuthStep({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const { user, isLoading, login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isLoading && user !== null) onDone()
  }, [user, isLoading, onDone])

  if (isLoading) return <p style={{ textAlign: 'center', color: T.muted, padding: 40 }}>Checking account…</p>

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register({ email, password, firstName, lastName })
      }
      onDone()
    } catch {
      setError(mode === 'login' ? 'Invalid email or password.' : 'Could not create account. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: T.navy, marginBottom: 4, marginTop: 0 }}>
        {mode === 'login' ? 'Sign In' : 'Create Account'}
      </h2>
      <p style={{ color: T.muted, fontSize: 13, marginBottom: 20 }}>
        {mode === 'login' ? "Sign in to complete your booking." : "Create a free account to continue."}
      </p>

      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{ background: T.errorBg, border: `1px solid ${T.errorBorder}`, borderRadius: 6, padding: '12px 16px', marginBottom: 16, color: T.error, fontSize: 13 }}>
            {error}
          </div>
        )}

        {mode === 'register' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 6 }}>First Name</label>
              <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required placeholder="Jane" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 6 }}>Last Name</label>
              <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required placeholder="Doe" style={inputStyle} />
            </div>
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 6 }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" style={inputStyle} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 6 }}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={mode === 'register' ? 8 : undefined} placeholder="••••••••" style={inputStyle} />
        </div>

        <button type="submit" disabled={submitting} style={btnPrimary(submitting)}>
          {submitting ? (mode === 'login' ? 'Signing in…' : 'Creating account…') : (mode === 'login' ? 'Sign In' : 'Create Account')}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: T.muted }}>
        {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
        <button
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null) }}
          style={{ background: 'none', border: 'none', color: T.teal, fontWeight: 600, cursor: 'pointer', fontSize: 13, padding: 0 }}
        >
          {mode === 'login' ? 'Create one' : 'Sign in'}
        </button>
      </p>

      <button onClick={onBack} style={{ ...btnSecondary, width: '100%', marginTop: 12 }}>Back</button>
    </div>
  )
}

// ─── Step 5: Payment ──────────────────────────────────────────────────────────

function PaymentForm({
  clientSecret,
  bookingInfo,
  onSuccess,
}: {
  clientSecret: string
  bookingInfo: BookingConfirmation
  onSuccess: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)

  async function handlePay(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setPaying(true)
    setPayError(null)
    const card = elements.getElement(CardElement)
    if (!card) { setPaying(false); return }
    const { error } = await stripe.confirmCardPayment(clientSecret, { payment_method: { card } })
    if (error) {
      setPayError(error.message ?? 'Payment failed. Please try again.')
      setPaying(false)
    } else {
      onSuccess()
    }
  }

  return (
    <form onSubmit={handlePay}>
      {payError && (
        <div style={{ background: T.errorBg, border: `1px solid ${T.errorBorder}`, borderRadius: 6, padding: '12px 16px', marginBottom: 16, color: T.error, fontSize: 13 }}>
          {payError}
        </div>
      )}
      <div style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '12px 14px', marginBottom: 20, background: '#fff' }}>
        <CardElement options={{ style: { base: { fontSize: '14px', color: T.navy, fontFamily: "'DM Sans', sans-serif" } } }} />
      </div>
      <button type="submit" disabled={paying || !stripe} style={btnPrimary(paying || !stripe)}>
        {paying ? 'Processing…' : 'Pay & Confirm Booking'}
      </button>
    </form>
  )
}

function LocationAck({
  checked,
  onToggle,
  children,
}: {
  checked: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 12, cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={onToggle} style={{ marginTop: 3 }} />
      <span style={{ fontSize: 13, color: T.navy, lineHeight: 1.45 }}>{children}</span>
    </label>
  )
}

function PaymentStep({
  service,
  date,
  slot,
  addonIds,
  customerDetails,
  existingHoldId,
  existingHoldKey,
  existingHoldData,
  onSuccess,
  onBack,
  onHoldReady,
  onClearHold,
  onBackToDateTime,
}: {
  service: Service
  date: string
  slot: Slot
  addonIds: string[]
  customerDetails: string
  existingHoldId: string | null
  existingHoldKey: string | null
  existingHoldData: HoldData | null
  onSuccess: (conf: BookingConfirmation, locationSummary: string) => void
  onBack: () => void
  onHoldReady: (holdId: string, holdKey: string, holdData: HoldData) => void
  onClearHold: () => void
  onBackToDateTime: () => void
}) {
  const locType = normalizeServiceLocationType(service.serviceLocationType)
  const currentHoldKey = [service.id, date, slot.startTime, addonIds.join(','), customerDetails].join('|')

  const [phase, setPhase] = useState<'loading' | 'hold_error' | 'review' | 'pi_loading' | 'ready' | 'error'>('loading')
  const [clientSecret, setClientSecret] = useState('')
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null)
  const [phaseError, setPhaseError] = useState<string | null>(null)
  const [business, setBusiness] = useState<PublicBusiness | null>(null)
  const [holdDisplay, setHoldDisplay] = useState<HoldData | null>(null)
  const [piDueNowCents, setPiDueNowCents] = useState<number | null>(null)
  const [releasingHold, setReleasingHold] = useState(false)
  const holdFiredRef = useRef(false)

  async function releaseHold(holdId: string): Promise<void> {
    try {
      const res = await fetch(`/api/bookings/hold/${holdId}`, { method: 'DELETE' })
      if (!res.ok && res.status !== 404) {
        console.warn('[book] release hold failed:', res.status)
      }
    } catch (e) {
      console.warn('[book] release hold error:', e)
    }
  }

  async function handleBack() {
    if (existingHoldId) {
      setReleasingHold(true)
      await releaseHold(existingHoldId)
      onClearHold()
      setReleasingHold(false)
    }
    onBack()
  }

  const [line1, setLine1] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [businessAck, setBusinessAck] = useState(false)
  const [alternateAck, setAlternateAck] = useState(false)
  const [virtualAck, setVirtualAck] = useState(false)
  const [customerReady, setCustomerReady] = useState(false)

  useEffect(() => {
    fetch('/api/bookings/business')
      .then(r => r.json())
      .then(data => setBusiness(data.business ?? data))
      .catch(() => setBusiness(null))
  }, [])

  useEffect(() => {
    if (holdFiredRef.current) return
    holdFiredRef.current = true

    // Reuse existing hold if inputs unchanged
    if (existingHoldKey === currentHoldKey && existingHoldData) {
      queueMicrotask(() => {
        setHoldDisplay(existingHoldData)
        setPhase('review')
      })
      return
    }

    // Create a new hold
    fetch('/api/bookings/hold', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: service.id,
        date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        addonIds: addonIds.length > 0 ? addonIds : undefined,
        customerDetails: customerDetails.trim() || undefined,
      }),
    })
      .then(async res => {
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}))
          throw new Error(errBody.message ?? errBody.error ?? 'Could not reserve time slot.')
        }
        return res.json()
      })
      .then(holdData => {
        const holdId: string = holdData.id ?? holdData.holdId ?? holdData.hold_id
        if (!holdId) {
          console.error('[book] hold response missing id field:', holdData)
          throw new Error('Unable to reserve your time slot. Please try again.')
        }
        const data: HoldData = {
          servicePriceCents: holdData.servicePriceCents ?? null,
          dueNowCents: holdData.dueNowCents ?? null,
          inPersonDueCents: holdData.inPersonDueCents ?? null,
          totalPriceCents: holdData.totalPriceCents ?? null,
          depositAmountCents: holdData.depositAmountCents ?? null,
          dueNowFeeCents: holdData.dueNowFeeBreakdown?.consumerServiceFeeAmount ?? null,
          durationMinutes: holdData.durationMinutes ?? null,
          startTime: holdData.startTime ?? null,
          endTime: holdData.endTime ?? null,
          addons: Array.isArray(holdData.addons) ? holdData.addons : [],
          depositNonRefundable: holdData.depositNonRefundable === true,
        }
        setHoldDisplay(data)
        onHoldReady(holdId, currentHoldKey, data)
        setPhase('review')
      })
      .catch(err => {
        setPhaseError(err instanceof Error ? err.message : 'Something went wrong.')
        setPhase('hold_error')
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function locationSummary(): string {
    if (locType === 'customer') {
      return formatLocationLine([line1, city && state ? `${city}, ${state}` : city || state, zipCode])
    }
    if (locType === 'alternate') {
      return formatLocationLine([
        service.alternateAddress,
        service.alternateCity && service.alternateState
          ? `${service.alternateCity}, ${service.alternateState}`
          : service.alternateCity || service.alternateState,
        service.alternateZipCode,
      ]) || consumerLocationLabel(locType)
    }
    if (locType === 'virtual') {
      return service.virtualLink || consumerLocationLabel(locType)
    }
    const showStreet = business?.showAddress !== false
    return formatLocationLine([
      showStreet ? business?.address : null,
      business?.city && business?.state ? `${business.city}, ${business.state}` : business?.city || business?.state,
    ]) || consumerLocationLabel(locType)
  }

  function canContinue(): boolean {
    if (locType === 'customer') {
      return customerAddressComplete({ line1, city, state, zipCode }) && customerReady
    }
    if (locType === 'alternate') return alternateAck
    if (locType === 'virtual') return virtualAck
    return businessAck
  }

  async function startPayment() {
    if (!canContinue()) {
      setPhaseError(
        locType === 'customer'
          ? 'Enter the service address and confirm you will be ready.'
          : 'Please confirm the location details to continue.'
      )
      return
    }
    setPhaseError(null)
    setPhase('pi_loading')

    const customerAddress = locType === 'customer'
      ? customerAddressPayload({ line1, city, state, zipCode })
      : {}

    async function tryPI(hId: string) {
      const res = await fetch('/api/bookings/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holdId: hId, ...customerAddress }),
      })
      const body = await res.json().catch(() => ({}))
      return { ok: res.ok, status: res.status, body }
    }

    try {
      let holdId = existingHoldId
      if (!holdId) throw new Error('No time slot reserved. Please go back and try again.')

      let piResult = await tryPI(holdId)

      if (!piResult.ok) {
        const isHoldGone = piResult.status === 404 ||
          /hold.*(expired|not found|missing|invalid)/i.test(piResult.body.message ?? '') ||
          /expired|missing|invalid.*hold/i.test(piResult.body.message ?? '')

        if (isHoldGone) {
          // Create a fresh hold and retry once
          const newHoldRes = await fetch('/api/bookings/hold', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              serviceId: service.id,
              date,
              startTime: slot.startTime,
              endTime: slot.endTime,
              addonIds: addonIds.length > 0 ? addonIds : undefined,
              customerDetails: customerDetails.trim() || undefined,
            }),
          })
          if (!newHoldRes.ok) {
            const newErr = await newHoldRes.json().catch(() => ({}))
            throw new Error(newErr.message ?? piResult.body.message ?? 'Unable to initialize payment. Please try again.')
          }
          const newHoldRaw = await newHoldRes.json()
          const newHoldId: string = newHoldRaw.id ?? newHoldRaw.holdId ?? newHoldRaw.hold_id
          if (!newHoldId) throw new Error(piResult.body.message ?? 'Unable to initialize payment. Please try again.')

          const newData: HoldData = {
            servicePriceCents: newHoldRaw.servicePriceCents ?? null,
            dueNowCents: newHoldRaw.dueNowCents ?? null,
            inPersonDueCents: newHoldRaw.inPersonDueCents ?? null,
            totalPriceCents: newHoldRaw.totalPriceCents ?? null,
            depositAmountCents: newHoldRaw.depositAmountCents ?? null,
            dueNowFeeCents: newHoldRaw.dueNowFeeBreakdown?.consumerServiceFeeAmount ?? null,
            durationMinutes: newHoldRaw.durationMinutes ?? null,
            startTime: newHoldRaw.startTime ?? null,
            endTime: newHoldRaw.endTime ?? null,
            addons: Array.isArray(newHoldRaw.addons) ? newHoldRaw.addons : [],
            depositNonRefundable: newHoldRaw.depositNonRefundable === true,
          }
          onHoldReady(newHoldId, currentHoldKey, newData)
          holdId = newHoldId
          piResult = await tryPI(newHoldId)
        }
      }

      if (!piResult.ok) {
        console.error('[book] payment-intent error:', piResult.status, piResult.body)
        throw new Error(piResult.body.message ?? 'Unable to initialize payment. Please try again.')
      }

      const piData = piResult.body

      if (
        piData.feeBreakdown?.grossChargeAmount != null &&
        holdDisplay?.dueNowCents != null &&
        piData.feeBreakdown.grossChargeAmount !== holdDisplay.dueNowCents
      ) {
        console.error('[book] PI/hold amount mismatch — PI grossChargeAmount:', piData.feeBreakdown.grossChargeAmount, 'hold dueNowCents:', holdDisplay.dueNowCents)
        setPiDueNowCents(piData.feeBreakdown.grossChargeAmount)
      }

      setClientSecret(piData.clientSecret)
      setConfirmation({ bookingNumber: piData.bookingNumber, appointmentId: piData.appointmentId })
      setPhase('ready')
    } catch (err) {
      setPhaseError(err instanceof Error ? err.message : 'Something went wrong.')
      setPhase('error')
    }
  }

  function formatDate(d: string) {
    return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  }

  function formatTime(t: string) {
    const [h, m] = t.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
  }

  return (
    <div>
      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: T.navy, marginBottom: 20, marginTop: 0 }}>
        Review & Pay
      </h2>

      <div style={{ background: '#FFF8F2', border: `1px solid #c8e8ea`, borderRadius: 8, padding: '16px 20px', marginBottom: 24 }}>
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontWeight: 600, color: T.navy, fontSize: 15 }}>{service.name}</span>
        </div>
        <div style={{ fontSize: 13, color: T.muted }}>{formatDate(date)}</div>
        {holdDisplay?.startTime && holdDisplay?.endTime ? (
          <div style={{ fontSize: 13, color: T.muted }}>{formatTime(holdDisplay.startTime)} – {formatTime(holdDisplay.endTime)}</div>
        ) : (
          <div style={{ fontSize: 13, color: T.muted }}>{formatTime(slot.startTime)} – {formatTime(slot.endTime)}</div>
        )}
        {holdDisplay?.durationMinutes != null ? (
          formatDuration(holdDisplay.durationMinutes) && <div style={{ fontSize: 13, color: T.muted }}>{formatDuration(holdDisplay.durationMinutes)}</div>
        ) : (
          formatDuration(service.durationMinutes) && <div style={{ fontSize: 13, color: T.muted }}>{formatDuration(service.durationMinutes)}</div>
        )}
        <div style={{ fontSize: 13, color: T.muted, marginTop: 6 }}>{consumerLocationLabel(locType)}</div>

        {holdDisplay && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid #c8e8ea` }}>
            {holdDisplay.servicePriceCents != null && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13, color: T.navy }}>
                <span>{service.name}</span>
                <span>${(holdDisplay.servicePriceCents / 100).toFixed(2)}</span>
              </div>
            )}
            {holdDisplay.addons.map(a => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13, color: T.muted }}>
                <span>+ {a.name}</span>
                <span>+${(a.priceCents / 100).toFixed(2)}</span>
              </div>
            ))}
            {holdDisplay.totalPriceCents != null && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: `1px solid #c8e8ea`, fontSize: 13, fontWeight: 600, color: T.navy }}>
                <span>Subtotal</span>
                <span>${(holdDisplay.totalPriceCents / 100).toFixed(2)}</span>
              </div>
            )}
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: T.muted }}>
              {holdDisplay.depositAmountCents != null && holdDisplay.depositAmountCents > 0 ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Deposit</span>
                    <span>${(holdDisplay.depositAmountCents / 100).toFixed(2)}</span>
                  </div>
                  {holdDisplay.dueNowFeeCents != null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Service fee (on deposit)</span>
                      <span>${(holdDisplay.dueNowFeeCents / 100).toFixed(2)}</span>
                    </div>
                  )}
                  {(holdDisplay.dueNowCents != null || piDueNowCents != null) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Due now</span>
                      <span style={{ fontWeight: 700, color: T.teal }}>${((piDueNowCents ?? holdDisplay.dueNowCents ?? 0) / 100).toFixed(2)}</span>
                    </div>
                  )}
                  {holdDisplay.inPersonDueCents != null && holdDisplay.inPersonDueCents > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Paid at appointment</span>
                      <span>${(holdDisplay.inPersonDueCents / 100).toFixed(2)}</span>
                    </div>
                  )}
                  {holdDisplay.depositNonRefundable && (
                    <div style={{ fontSize: 11, fontStyle: 'italic', marginTop: 4 }}>Deposit is non-refundable.</div>
                  )}
                </>
              ) : (
                <>
                  {holdDisplay.dueNowFeeCents != null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Service fee</span>
                      <span>${(holdDisplay.dueNowFeeCents / 100).toFixed(2)}</span>
                    </div>
                  )}
                  {(holdDisplay.dueNowCents != null || piDueNowCents != null) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Due now</span>
                      <span style={{ fontWeight: 700, color: T.teal }}>${((piDueNowCents ?? holdDisplay.dueNowCents ?? 0) / 100).toFixed(2)}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Location</div>

        {(locType === 'business') && (
          <>
            {business?.showAddress !== false && business?.address ? (
              <div style={{ fontSize: 14, color: T.navy, lineHeight: 1.5 }}>
                {formatLocationLine([
                  business.address,
                  business.city && business.state ? `${business.city}, ${business.state}` : business.city || business.state,
                ])}
              </div>
            ) : (
              <>
                <div style={{ fontSize: 14, color: T.navy }}>
                  {business?.city && business?.state
                    ? `${business.city}, ${business.state}`
                    : business?.city || business?.state || `${business?.name ?? 'Studio'} location`}
                </div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 6 }}>
                  The exact address will be provided once your booking is confirmed.
                </div>
              </>
            )}
            <LocationAck checked={businessAck} onToggle={() => setBusinessAck(v => !v)}>
              {business?.showAddress === false
                ? 'I understand this appointment takes place in the listed city'
                : 'I understand this appointment takes place at the address above'}
            </LocationAck>
          </>
        )}

        {locType === 'virtual' && (
          <>
            <div style={{ fontSize: 14, color: T.navy }}>You&apos;ll join this meeting link at your appointment time:</div>
            <div style={{ fontSize: 14, color: T.teal, fontWeight: 600, marginTop: 6, wordBreak: 'break-all' }}>
              {service.virtualLink || 'Meeting link not set'}
            </div>
            <LocationAck checked={virtualAck} onToggle={() => setVirtualAck(v => !v)}>
              I understand I will join this meeting link at my scheduled appointment time.
            </LocationAck>
          </>
        )}

        {locType === 'alternate' && (
          <>
            <div style={{ fontSize: 14, color: T.navy, lineHeight: 1.5 }}>
              {formatLocationLine([
                service.alternateAddress,
                service.alternateCity && service.alternateState
                  ? `${service.alternateCity}, ${service.alternateState}`
                  : service.alternateCity || service.alternateState,
                service.alternateZipCode,
              ])}
            </div>
            <LocationAck checked={alternateAck} onToggle={() => setAlternateAck(v => !v)}>
              I understand this service takes place at the address above
            </LocationAck>
          </>
        )}

        {locType === 'customer' && (
          <>
            <div style={{ fontSize: 13, color: T.muted, marginBottom: 12 }}>Where should this service take place?</div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 6 }}>Street address</label>
              <input value={line1} onChange={e => setLine1(e.target.value)} placeholder="123 Main Street" style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 100px', gap: 10, marginBottom: 4 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 6 }}>City</label>
                <input value={city} onChange={e => setCity(e.target.value)} placeholder="City" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 6 }}>State</label>
                <input value={state} onChange={e => setState(e.target.value)} placeholder="VA" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 6 }}>ZIP</label>
                <input value={zipCode} onChange={e => setZipCode(e.target.value)} placeholder="23451" style={inputStyle} />
              </div>
            </div>
            <LocationAck checked={customerReady} onToggle={() => setCustomerReady(v => !v)}>
              I confirm I will be ready for this service at the scheduled appointment time
            </LocationAck>
          </>
        )}
      </div>

      {phase === 'loading' && (
        <div style={{ textAlign: 'center', padding: '20px 0', color: T.muted, fontSize: 14 }}>
          Calculating your total…
        </div>
      )}

      {phase === 'hold_error' && (
        <>
          <div style={{ background: T.errorBg, border: `1px solid ${T.errorBorder}`, borderRadius: 6, padding: '12px 16px', marginBottom: 20, color: T.error, fontSize: 13 }}>
            {phaseError}
          </div>
          <button onClick={onBackToDateTime} style={{ ...btnSecondary, width: '100%' }}>Choose another time</button>
        </>
      )}

      {(phase === 'review' || phase === 'pi_loading') && phaseError && (
        <div style={{ background: T.errorBg, border: `1px solid ${T.errorBorder}`, borderRadius: 6, padding: '12px 16px', marginBottom: 16, color: T.error, fontSize: 13 }}>
          {phaseError}
        </div>
      )}

      {phase === 'review' && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
          <button onClick={handleBack} disabled={releasingHold} style={{ ...btnSecondary, flex: 1 }}>
            {releasingHold ? '…' : 'Back'}
          </button>
          <button onClick={startPayment} disabled={!canContinue() || releasingHold} style={{ ...btnPrimary(!canContinue() || releasingHold), flex: 2 }}>
            Continue to payment
          </button>
        </div>
      )}

      {phase === 'pi_loading' && (
        <div style={{ textAlign: 'center', padding: '20px 0', color: T.muted, fontSize: 14 }}>
          Preparing payment…
        </div>
      )}

      {phase === 'error' && (
        <>
          <div style={{ background: T.errorBg, border: `1px solid ${T.errorBorder}`, borderRadius: 6, padding: '12px 16px', marginBottom: 20, color: T.error, fontSize: 13 }}>
            {phaseError}
          </div>
          <button onClick={onBackToDateTime} style={{ ...btnSecondary, width: '100%' }}>Choose another time</button>
        </>
      )}

      {phase === 'ready' && clientSecret && confirmation && (
        <Elements
          stripe={stripePromise}
          options={{ clientSecret }}
        >
          <PaymentForm
            clientSecret={clientSecret}
            bookingInfo={confirmation}
            onSuccess={() => onSuccess(confirmation, locationSummary())}
          />
        </Elements>
      )}

      {phase === 'ready' && (
        <button onClick={onBackToDateTime} style={{ ...btnSecondary, width: '100%', marginTop: 12 }}>Start over</button>
      )}
    </div>
  )
}

// ─── Step 6: Confirmation ─────────────────────────────────────────────────────

function ConfirmStep({ service, date, slot, confirmation, locationSummary, customerDetails, holdData }: {
  service: Service
  date: string
  slot: Slot
  confirmation: BookingConfirmation
  locationSummary: string
  customerDetails: string
  holdData: HoldData | null
}) {
  function formatDate(d: string) {
    return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  }

  function formatTime(t: string) {
    const [h, m] = t.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600, color: T.navy, marginBottom: 8, marginTop: 0 }}>
        You&apos;re booked!
      </h2>
      <p style={{ color: T.muted, fontSize: 14, marginBottom: 28 }}>
        A confirmation email is on its way to you.
      </p>

      <div style={{ background: '#FFF8F2', border: `1px solid #c8e8ea`, borderRadius: 8, padding: '20px 24px', marginBottom: 28, textAlign: 'left' }}>
        <div style={{ marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Booking #</span>
          <div style={{ fontWeight: 700, fontSize: 18, color: T.navy, fontFamily: 'monospace' }}>{confirmation.bookingNumber}</div>
        </div>
        <hr style={{ border: 'none', borderTop: `1px solid #c8e8ea`, margin: '12px 0' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: T.muted }}>Service</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{service.name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: T.muted }}>Date</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{formatDate(date)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: T.muted }}>Time</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{formatTime(slot.startTime)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontSize: 13, color: T.muted }}>Location</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.navy, textAlign: 'right' }}>{locationSummary}</span>
          </div>
          {holdData && (
            <>
              {holdData.addons.map(a => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: T.muted }}>+ {a.name}</span>
                  <span style={{ fontSize: 13, color: T.muted }}>+${(a.priceCents / 100).toFixed(2)}</span>
                </div>
              ))}
              {holdData.totalPriceCents != null && (
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: `1px solid #c8e8ea`, marginTop: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>Subtotal</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>${(holdData.totalPriceCents / 100).toFixed(2)}</span>
                </div>
              )}
              {holdData.depositAmountCents != null && holdData.depositAmountCents > 0 ? (
                <>
                  {holdData.dueNowFeeCents != null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, color: T.muted }}>Service fee (on deposit)</span>
                      <span style={{ fontSize: 13, color: T.muted }}>${(holdData.dueNowFeeCents / 100).toFixed(2)}</span>
                    </div>
                  )}
                  {holdData.dueNowCents != null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, color: T.muted }}>Due now</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: T.teal }}>${(holdData.dueNowCents / 100).toFixed(2)}</span>
                    </div>
                  )}
                  {holdData.inPersonDueCents != null && holdData.inPersonDueCents > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, color: T.muted }}>Paid at appointment</span>
                      <span style={{ fontSize: 13, color: T.muted }}>${(holdData.inPersonDueCents / 100).toFixed(2)}</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {holdData.dueNowFeeCents != null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, color: T.muted }}>Service fee</span>
                      <span style={{ fontSize: 13, color: T.muted }}>${(holdData.dueNowFeeCents / 100).toFixed(2)}</span>
                    </div>
                  )}
                  {holdData.dueNowCents != null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, color: T.muted }}>Due now</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: T.teal }}>${(holdData.dueNowCents / 100).toFixed(2)}</span>
                    </div>
                  )}
                </>
              )}
            </>
          )}
          {customerDetails.trim() && (
            <div style={{ marginTop: 4, paddingTop: 8, borderTop: `1px solid #c8e8ea` }}>
              <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Notes</div>
              <div style={{ fontSize: 13, color: T.navy, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{customerDetails}</div>
            </div>
          )}
        </div>
      </div>

      <Link
        href="/"
        style={{ display: 'block', background: T.teal, color: '#fff', borderRadius: 6, padding: '13px', fontSize: 14, fontWeight: 600, textDecoration: 'none', letterSpacing: '0.04em' }}
      >
        Back to Home
      </Link>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BookPage() {
  const { user } = useAuth()
  const [step, setStep] = useState<Step>('service')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null)
  const [locationSummary, setLocationSummary] = useState('')
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([])
  const [customerDetails, setCustomerDetails] = useState('')
  const [skipAuth, setSkipAuth] = useState(false)
  const [savedHoldId, setSavedHoldId] = useState<string | null>(null)
  const [savedHoldKey, setSavedHoldKey] = useState<string | null>(null)
  const [savedHoldData, setSavedHoldData] = useState<HoldData | null>(null)
  // Only honour ?serviceId= once, so "Back" returns to the picker instead of re-selecting.
  const [preselectUsed, setPreselectUsed] = useState(false)

  return (
    <div style={{ minHeight: '100vh', background: T.bg, padding: '40px 16px', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 520, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600, color: T.navy, letterSpacing: '0.02em' }}>Braids by Lana</span>
          </Link>
        </div>

        {step !== 'confirm' && <ProgressBar step={step} />}

        <div style={{ background: T.card, borderRadius: 10, padding: '36px 32px', boxShadow: '0 2px 24px rgba(28,16,8,0.08)' }}>
          {step === 'service' && (
            <Suspense fallback={<p style={{ textAlign: 'center', color: T.muted, padding: 40 }}>Loading services…</p>}>
              <ServiceStep
                allowPreselect={!preselectUsed}
                onSelect={service => {
                  setPreselectUsed(true)
                  setSelectedService(service)
                  setStep('datetime')
                }}
              />
            </Suspense>
          )}

          {step === 'datetime' && selectedService && (
            <DateTimeStep
              service={selectedService}
              addonIds={selectedAddonIds}
              onSelect={(date, slot) => {
                setSelectedDate(date)
                setSelectedSlot(slot)
                if (user !== null) {
                  setSkipAuth(true)
                  setStep('addons')
                } else {
                  setSkipAuth(false)
                  setStep('auth')
                }
              }}
              onBack={() => setStep('service')}
            />
          )}

          {step === 'auth' && (
            <AuthStep
              onDone={() => setStep('addons')}
              onBack={() => setStep('datetime')}
            />
          )}

          {step === 'addons' && selectedService && selectedSlot && (
            <AddOnsStep
              service={selectedService}
              selectedAddonIds={selectedAddonIds}
              customerDetails={customerDetails}
              date={selectedDate}
              slot={selectedSlot}
              onSelect={(ids, details) => {
                setSelectedAddonIds(ids)
                setCustomerDetails(details)
                setStep('payment')
              }}
              onBack={() => setStep(skipAuth ? 'datetime' : 'auth')}
            />
          )}

          {step === 'payment' && selectedService && selectedSlot && (
            <PaymentStep
              service={selectedService}
              date={selectedDate}
              slot={selectedSlot}
              addonIds={selectedAddonIds}
              customerDetails={customerDetails}
              existingHoldId={savedHoldId}
              existingHoldKey={savedHoldKey}
              existingHoldData={savedHoldData}
              onHoldReady={(holdId, holdKey, holdData) => {
                setSavedHoldId(holdId)
                setSavedHoldKey(holdKey)
                setSavedHoldData(holdData)
              }}
              onClearHold={() => {
                setSavedHoldId(null)
                setSavedHoldKey(null)
                setSavedHoldData(null)
              }}
              onSuccess={(conf, summary) => {
                setConfirmation(conf)
                setLocationSummary(summary)
                setStep('confirm')
              }}
              onBack={() => setStep('addons')}
              onBackToDateTime={() => setStep('datetime')}
            />
          )}

          {step === 'confirm' && selectedService && selectedSlot && confirmation && (
            <ConfirmStep
              service={selectedService}
              date={selectedDate}
              slot={selectedSlot}
              confirmation={confirmation}
              locationSummary={locationSummary}
              customerDetails={customerDetails}
              holdData={savedHoldData}
            />
          )}
        </div>
      </div>
    </div>
  )
}
