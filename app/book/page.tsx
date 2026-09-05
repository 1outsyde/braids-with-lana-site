'use client'
import { useState, useEffect, useCallback } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// ─── Types ───────────────────────────────────────────────────────────────────

interface Service {
  id: string
  name: string
  description?: string
  price: number
  durationMinutes: number
  category?: string
  isActive: boolean
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

type Step = 'service' | 'datetime' | 'auth' | 'payment' | 'confirm'

// ─── Design tokens ───────────────────────────────────────────────────────────

const T = {
  teal: '#29C5CC',
  tealLight: '#a0d8db',
  navy: '#0D2B35',
  gold: '#C9A84C',
  muted: '#6b8c94',
  border: '#d1dce0',
  bg: '#f8fafa',
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
  fontSize: 14,
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

const STEPS: Step[] = ['service', 'datetime', 'auth', 'payment', 'confirm']
const STEP_LABELS = ['Service', 'Date & Time', 'Account', 'Payment', 'Confirmed']

function ProgressBar({ step }: { step: Step }) {
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
        {STEP_LABELS.map((label, i) => (
          <span key={label} style={{ fontSize: 10, color: i <= idx ? T.teal : T.muted, fontWeight: i === idx ? 700 : 400, width: 60, textAlign: 'center' }}>
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Step 1: Service picker ───────────────────────────────────────────────────

function ServiceStep({ onSelect }: { onSelect: (s: Service) => void }) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
                <div style={{ fontSize: 12, color: T.muted, marginTop: 6 }}>{service.durationMinutes} min</div>
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
  onSelect,
  onBack,
}: {
  service: Service
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
    const params = new URLSearchParams({ date: d, serviceDurationMinutes: String(service.durationMinutes) })
    fetch(`/api/bookings/availability?${params}`)
      .then(r => r.json())
      .then(data => {
        const list: Slot[] = Array.isArray(data) ? data : (data.slots ?? [])
        setSlots(list)
        setLoadingSlots(false)
      })
      .catch(() => { setSlotsError('Could not load availability.'); setLoadingSlots(false) })
  }, [service.durationMinutes])

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
      <p style={{ color: T.muted, fontSize: 13, marginBottom: 20 }}>{service.name} · {service.durationMinutes} min</p>

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
                    padding: '10px 4px', borderRadius: 6, fontSize: 13, fontWeight: 500,
                    border: `1px solid ${active ? T.teal : T.border}`,
                    background: active ? T.teal : '#fff',
                    color: active ? '#fff' : T.navy,
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

// ─── Step 4: Payment ──────────────────────────────────────────────────────────

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

function PaymentStep({
  service,
  date,
  slot,
  onSuccess,
  onBack,
}: {
  service: Service
  date: string
  slot: Slot
  onSuccess: (conf: BookingConfirmation) => void
  onBack: () => void
}) {
  const [phase, setPhase] = useState<'holding' | 'ready' | 'error'>('holding')
  const [clientSecret, setClientSecret] = useState('')
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null)
  const [phaseError, setPhaseError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function initPayment() {
      try {
        // 1. Create hold
        const holdRes = await fetch('/api/bookings/hold', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceId: service.id,
            date,
            startTime: slot.startTime,
            endTime: slot.endTime,
          }),
        })
        if (!holdRes.ok) throw new Error('Could not reserve time slot.')
        const holdData = await holdRes.json()
        const holdId: string = holdData.id ?? holdData.holdId

        if (!holdId) throw new Error('Invalid hold response.')

        // 2. Create payment intent
        const piRes = await fetch('/api/bookings/deposit-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ holdId }),
        })
        if (!piRes.ok) throw new Error('Could not initialize payment.')
        const piData = await piRes.json()

        if (!cancelled) {
          setClientSecret(piData.clientSecret)
          setConfirmation({ bookingNumber: piData.bookingNumber, appointmentId: piData.appointmentId })
          setPhase('ready')
        }
      } catch (err) {
        if (!cancelled) {
          setPhaseError(err instanceof Error ? err.message : 'Something went wrong.')
          setPhase('error')
        }
      }
    }

    initPayment()
    return () => { cancelled = true }
  }, [service.id, date, slot.startTime, slot.endTime])

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

      <div style={{ background: '#f0f9fa', border: `1px solid #c8e8ea`, borderRadius: 8, padding: '16px 20px', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontWeight: 600, color: T.navy, fontSize: 15 }}>{service.name}</span>
          <span style={{ fontWeight: 700, color: T.gold, fontSize: 15 }}>${(service.price / 100).toFixed(2)}</span>
        </div>
        <div style={{ fontSize: 13, color: T.muted }}>{formatDate(date)}</div>
        <div style={{ fontSize: 13, color: T.muted }}>{formatTime(slot.startTime)} – {formatTime(slot.endTime)}</div>
        <div style={{ fontSize: 13, color: T.muted }}>{service.durationMinutes} min</div>
      </div>

      {phase === 'holding' && (
        <div style={{ textAlign: 'center', padding: '20px 0', color: T.muted, fontSize: 14 }}>
          Reserving your time slot…
        </div>
      )}

      {phase === 'error' && (
        <>
          <div style={{ background: T.errorBg, border: `1px solid ${T.errorBorder}`, borderRadius: 6, padding: '12px 16px', marginBottom: 20, color: T.error, fontSize: 13 }}>
            {phaseError}
          </div>
          <button onClick={onBack} style={{ ...btnSecondary, width: '100%' }}>Go Back</button>
        </>
      )}

      {phase === 'ready' && clientSecret && confirmation && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PaymentForm
            clientSecret={clientSecret}
            bookingInfo={confirmation}
            onSuccess={() => onSuccess(confirmation)}
          />
        </Elements>
      )}

      {phase === 'ready' && (
        <button onClick={onBack} style={{ ...btnSecondary, width: '100%', marginTop: 12 }}>Back</button>
      )}
    </div>
  )
}

// ─── Step 5: Confirmation ─────────────────────────────────────────────────────

function ConfirmStep({ service, date, slot, confirmation }: {
  service: Service
  date: string
  slot: Slot
  confirmation: BookingConfirmation
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

      <div style={{ background: '#f0f9fa', border: `1px solid #c8e8ea`, borderRadius: 8, padding: '20px 24px', marginBottom: 28, textAlign: 'left' }}>
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
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: T.muted }}>Total</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.gold }}>${(service.price / 100).toFixed(2)}</span>
          </div>
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
  const [step, setStep] = useState<Step>('service')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null)

  return (
    <div style={{ minHeight: '100vh', background: T.bg, padding: '40px 16px', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 520, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600, color: T.navy, letterSpacing: '0.02em' }}>Braids With Love</span>
          </Link>
        </div>

        {step !== 'confirm' && <ProgressBar step={step} />}

        <div style={{ background: T.card, borderRadius: 10, padding: '36px 32px', boxShadow: '0 2px 24px rgba(13,43,53,0.08)' }}>
          {step === 'service' && (
            <ServiceStep
              onSelect={service => {
                setSelectedService(service)
                setStep('datetime')
              }}
            />
          )}

          {step === 'datetime' && selectedService && (
            <DateTimeStep
              service={selectedService}
              onSelect={(date, slot) => {
                setSelectedDate(date)
                setSelectedSlot(slot)
                setStep('auth')
              }}
              onBack={() => setStep('service')}
            />
          )}

          {step === 'auth' && (
            <AuthStep
              onDone={() => setStep('payment')}
              onBack={() => setStep('datetime')}
            />
          )}

          {step === 'payment' && selectedService && selectedSlot && (
            <PaymentStep
              service={selectedService}
              date={selectedDate}
              slot={selectedSlot}
              onSuccess={conf => {
                setConfirmation(conf)
                setStep('confirm')
              }}
              onBack={() => setStep('auth')}
            />
          )}

          {step === 'confirm' && selectedService && selectedSlot && confirmation && (
            <ConfirmStep
              service={selectedService}
              date={selectedDate}
              slot={selectedSlot}
              confirmation={confirmation}
            />
          )}
        </div>
      </div>
    </div>
  )
}
