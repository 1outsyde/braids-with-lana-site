'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

// ── Types ────────────────────────────────────────────────────────────────────
interface Service {
  id: string
  name: string
  description: string
  price_in_cents: number
  duration_minutes: number
  image_url?: string
  category?: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtPrice(cents: number) {
  return `$${(cents / 100).toFixed(0)}`
}

function fmtDur(mins: number) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

// ── Nav ──────────────────────────────────────────────────────────────────────
function Nav({ scrolled }: { scrolled: boolean }) {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0)',
      backdropFilter: scrolled ? 'blur(16px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(0,0,0,0.07)' : '1px solid transparent',
      transition: 'all 0.3s ease',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', border: '2px solid #29C5CC', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(41,197,204,0.06)' }}>
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, fontWeight: 600, color: '#29C5CC', fontStyle: 'italic' }}>B</span>
          </div>
          <div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 17, fontWeight: 600, color: '#0D2B35', lineHeight: 1.1 }}>Braids With Love</div>
            <div style={{ fontSize: 9, color: '#29C5CC', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }}>Virginia Beach, VA</div>
          </div>
        </div>
        {/* Links */}
        <div style={{ display: 'flex', gap: 36, alignItems: 'center' }}>
          {['Services', 'Gallery', 'About', 'Contact'].map(l => (
            <a key={l} href={`#${l.toLowerCase()}`}
              style={{ fontSize: 13, color: '#5a7a80', textDecoration: 'none', letterSpacing: '0.03em', fontWeight: 400 }}
              onMouseEnter={e => (e.currentTarget.style.color = '#0D2B35')}
              onMouseLeave={e => (e.currentTarget.style.color = '#5a7a80')}>{l}</a>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <Link href="/login" style={{ fontSize: 13, color: '#5a7a80', textDecoration: 'none' }}>Sign in</Link>
          <a href="#book" style={{ background: '#29C5CC', color: '#fff', fontSize: 13, fontWeight: 600, padding: '9px 22px', borderRadius: 3, textDecoration: 'none', letterSpacing: '0.04em', boxShadow: '0 2px 12px rgba(41,197,204,0.3)' }}>Book Now</a>
        </div>
      </div>
    </nav>
  )
}

// ── Hero ─────────────────────────────────────────────────────────────────────
function Hero({ heroImage }: { heroImage: string | null }) {
  const panelStyle: React.CSSProperties = heroImage
    ? { backgroundImage: `url('${heroImage}')`, backgroundSize: 'cover', backgroundPosition: 'center top' }
    : { background: '#29C5CC' }

  return (
    <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'stretch', overflow: 'hidden', background: '#f8fafa' }}>
      {/* Left — text */}
      <div style={{ flex: '0 0 50%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '120px 64px 80px 10%', position: 'relative', zIndex: 2 }}>
        {/* Live badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(41,197,204,0.1)', border: '1px solid rgba(41,197,204,0.3)', borderRadius: 24, padding: '6px 16px', marginBottom: 32, alignSelf: 'flex-start' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#29C5CC', boxShadow: '0 0 8px rgba(41,197,204,0.8)' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: '#1a8f94', letterSpacing: '0.08em' }}>Now accepting bookings</span>
        </div>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(52px,5.5vw,80px)', fontWeight: 400, lineHeight: 1.02, color: '#0D2B35', marginBottom: 24, letterSpacing: '-0.01em' }}>
          Where every<br />
          braid tells<br />
          <em style={{ color: '#29C5CC', fontWeight: 300 }}>your story.</em>
        </h1>
        <p style={{ fontSize: 16, color: '#4a6872', lineHeight: 1.75, maxWidth: 380, marginBottom: 40 }}>
          Knotless braids, box braids, faux locs, and more — booked online in minutes. No DMs, no waiting.
        </p>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', marginBottom: 52 }}>
          <a href="#book" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: '#29C5CC', color: '#fff', fontSize: 14, fontWeight: 600, padding: '14px 30px', borderRadius: 3, textDecoration: 'none', letterSpacing: '0.03em', boxShadow: '0 4px 20px rgba(41,197,204,0.35)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            Book an appointment
          </a>
          <a href="#services" style={{ fontSize: 14, color: '#29C5CC', textDecoration: 'none', fontWeight: 500 }}>
            View services →
          </a>
        </div>
        {/* Trust row */}
        <div style={{ display: 'flex', gap: 28, paddingTop: 24, borderTop: '1px solid rgba(0,0,0,0.07)' }}>
          {[
            { icon: '📅', label: 'Book online 24/7' },
            { icon: '🔒', label: 'Secure checkout' },
            { icon: '⭐', label: 'Earn rewards' },
          ].map(t => (
            <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>{t.icon}</span>
              <span style={{ fontSize: 12, color: '#5a7a80', fontWeight: 500 }}>{t.label}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Right — photo */}
      <div style={{ flex: '0 0 50%', position: 'relative', minHeight: 600 }}>
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, left: '8%',
          ...panelStyle,
          borderRadius: '0 0 0 48px', overflow: 'hidden',
        }}>
          {!heroImage && (
            <>
              <div style={{ position: 'absolute', inset: 0, opacity: 0.15, backgroundImage: 'radial-gradient(circle at 30% 70%, rgba(255,255,255,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.3) 0%, transparent 40%)' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', fontWeight: 600, marginBottom: 4 }}>Upload a hero photo from the dashboard</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Settings → Site Hero Image</div>
                </div>
              </div>
            </>
          )}
          {/* Floating card */}
          <div style={{ position: 'absolute', bottom: 48, left: 32, background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(41,197,204,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>✂️</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0D2B35', marginBottom: 2 }}>5-star experience</div>
              <div style={{ fontSize: 11, color: '#5a7a80' }}>Virginia Beach&apos;s top braider</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Services ─────────────────────────────────────────────────────────────────
function Services({ services, loading }: { services: Service[]; loading: boolean }) {
  const CARD_COLORS = ['#e8f9fa', '#fff5e6', '#f0f9ff', '#f5f0ff', '#e8faf5']
  return (
    <section id="services" style={{ padding: '96px 0', background: '#fff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 52 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 32, height: 2, background: '#29C5CC', borderRadius: 1 }} />
              <span style={{ fontSize: 12, color: '#29C5CC', letterSpacing: '0.1em', fontWeight: 600, textTransform: 'uppercase' as const }}>What we offer</span>
            </div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(36px,4vw,52px)', fontWeight: 400, lineHeight: 1.1, color: '#0D2B35' }}>
              Services crafted<br />
              <em style={{ color: '#29C5CC' }}>for your hair.</em>
            </h2>
          </div>
          <a href="#book" style={{ fontSize: 13, color: '#29C5CC', textDecoration: 'none', fontWeight: 600, marginBottom: 8 }}>All services →</a>
        </div>
        {loading && (
          <div style={{ display: 'flex', gap: 20 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ flex: '0 0 268px', height: 340, background: '#f8fafa', borderRadius: 12, border: '1.5px solid #eef2f3' }} />
            ))}
          </div>
        )}
        {!loading && services.length === 0 && (
          <div style={{ padding: '64px 0', textAlign: 'center', color: '#9ab3b8' }}>
            <p style={{ fontSize: 15 }}>Services coming soon.</p>
          </div>
        )}
        {!loading && services.length > 0 && (
          <div style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none' as const }}>
            {services.map((s, i) => (
              <div key={s.id} style={{ flex: '0 0 268px', background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1.5px solid #eef2f3', cursor: 'pointer', transition: 'all 0.25s', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#29C5CC'; el.style.transform = 'translateY(-6px)'; el.style.boxShadow = '0 12px 32px rgba(41,197,204,0.15)' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#eef2f3'; el.style.transform = 'translateY(0)'; el.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)' }}>
                {/* Image area */}
                <div style={{ height: 180, overflow: 'hidden', position: 'relative' }}>
                  {s.image_url
                    ? <img src={s.image_url} alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', background: CARD_COLORS[i % CARD_COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#29C5CC', opacity: 0.5, fontSize: 32 }}>✂</div>
                  }
                  {s.category && (
                    <div style={{ position: 'absolute', top: 12, left: 12, background: '#29C5CC', borderRadius: 20, padding: '3px 12px', fontSize: 10, color: '#fff', fontWeight: 600, letterSpacing: '0.06em' }}>{s.category}</div>
                  )}
                </div>
                {/* Body */}
                <div style={{ padding: '20px 20px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 21, fontWeight: 600, color: '#0D2B35', lineHeight: 1.2 }}>{s.name}</h3>
                    <span style={{ color: '#C9A84C', fontWeight: 700, fontSize: 16, whiteSpace: 'nowrap', marginLeft: 10 }}>From {fmtPrice(s.price_in_cents)}</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#6b8c94', lineHeight: 1.65, marginBottom: 18 }}>{s.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#9ab3b8' }}>⏱ {fmtDur(s.duration_minutes)}</span>
                    <Link href={`/book?serviceId=${s.id}`} style={{ background: '#29C5CC', border: 'none', borderRadius: 3, color: '#fff', fontSize: 12, fontWeight: 600, padding: '8px 18px', cursor: 'pointer', letterSpacing: '0.04em', textDecoration: 'none', display: 'inline-block' }}>
                      Book this →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// ── Why ───────────────────────────────────────────────────────────────────────
function Why() {
  return (
    <section style={{ padding: '88px 0', background: '#f8fafa' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 52 }}>
          <div style={{ width: 32, height: 2, background: '#29C5CC', borderRadius: 1 }} />
          <span style={{ fontSize: 12, color: '#29C5CC', letterSpacing: '0.1em', fontWeight: 600, textTransform: 'uppercase' as const }}>Why choose us</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 2 }}>
          {[
            { n: '01', t: 'Book in minutes', b: 'Live availability, instant confirmation, secure online payment. No back-and-forth needed.', icon: '📅' },
            { n: '02', t: 'Hair health first', b: 'Every style installed with care for your edges and scalp. Never over-tensioned.', icon: '💚' },
            { n: '03', t: 'Earn every visit', b: 'Loyalty points added automatically. Redeem for money off your next appointment.', icon: '⭐' },
          ].map((item, i) => (
            <div key={item.n} style={{ background: '#fff', padding: '40px 36px', border: '1.5px solid #eef2f3', borderRadius: i === 0 ? '12px 0 0 12px' : i === 2 ? '0 12px 12px 0' : '0', transition: 'border-color 0.2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#29C5CC'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#eef2f3'}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(41,197,204,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 20 }}>{item.icon}</div>
              <div style={{ fontSize: 11, color: '#29C5CC', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 10 }}>{item.n}</div>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 600, color: '#0D2B35', marginBottom: 12, lineHeight: 1.2 }}>{item.t}</h3>
              <p style={{ fontSize: 14, color: '#6b8c94', lineHeight: 1.8 }}>{item.b}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── CTA Banner ────────────────────────────────────────────────────────────────
function BookCTA() {
  return (
    <section id="book" style={{ background: '#0D2B35', padding: '100px 40px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr auto', gap: 64, alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 32, height: 2, background: '#29C5CC', borderRadius: 1 }} />
            <span style={{ fontSize: 12, color: '#29C5CC', letterSpacing: '0.1em', fontWeight: 600, textTransform: 'uppercase' as const }}>Ready to book?</span>
          </div>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(40px,5vw,64px)', fontWeight: 300, lineHeight: 1.05, color: '#fff', marginBottom: 16 }}>
            Your next look<br /><em style={{ color: '#29C5CC', fontWeight: 400 }}>starts here.</em>
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, maxWidth: 480 }}>
            Pick your style, choose a date, pay securely. Address confirmed after booking.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, minWidth: 220 }}>
          <Link href="/book" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#29C5CC', color: '#fff', fontSize: 15, fontWeight: 600, padding: '16px 36px', borderRadius: 3, textDecoration: 'none', letterSpacing: '0.03em', boxShadow: '0 4px 24px rgba(41,197,204,0.4)', whiteSpace: 'nowrap' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            Book your appointment
          </Link>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em' }}>No DMs · No waiting · Earn rewards</span>
        </div>
      </div>
    </section>
  )
}

// ── Contact ───────────────────────────────────────────────────────────────────
function Contact() {
  return (
    <section id="contact" style={{ padding: '88px 40px', background: '#fff', borderTop: '1px solid #eef2f3' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 32, height: 2, background: '#29C5CC', borderRadius: 1 }} />
            <span style={{ fontSize: 12, color: '#29C5CC', letterSpacing: '0.1em', fontWeight: 600, textTransform: 'uppercase' as const }}>Get in touch</span>
          </div>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 44, fontWeight: 400, color: '#0D2B35', lineHeight: 1.1, marginBottom: 20 }}>
            Questions?<br /><em style={{ color: '#6b8c94', fontWeight: 300 }}>We&apos;re here.</em>
          </h2>
          <p style={{ fontSize: 14, color: '#6b8c94', lineHeight: 1.85, maxWidth: 340 }}>
            Have a question about a style, pricing, or availability? Reach out — or book online and we handle the rest.
          </p>
        </div>
        <div>
          {[
            { label: 'Location', value: 'Virginia Beach, VA', sub: 'Address confirmed after booking' },
            { label: 'Email', value: 'braidswithlove757@gmail.com', sub: '' },
            { label: 'Hours', value: 'By appointment only', sub: 'Book online to see availability' },
          ].map(item => (
            <div key={item.label} style={{ borderTop: '1px solid #eef2f3', padding: '22px 0' }}>
              <div style={{ fontSize: 10, color: '#29C5CC', letterSpacing: '0.14em', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' as const }}>{item.label}</div>
              <div style={{ fontSize: 15, color: '#0D2B35', fontWeight: 500 }}>{item.value}</div>
              {item.sub && <div style={{ fontSize: 12, color: '#9ab3b8', marginTop: 3 }}>{item.sub}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ padding: '28px 40px', background: '#0D2B35' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', border: '1.5px solid rgba(41,197,204,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 14, color: '#29C5CC', fontStyle: 'italic' }}>B</span>
          </div>
          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 15, color: '#fff', fontWeight: 600 }}>Braids With Love</span>
        </div>
        <div style={{ display: 'flex', gap: 28 }}>
          {['Services', 'Gallery', 'Contact'].map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', letterSpacing: '0.04em' }}>{l}</a>
          ))}
          <Link href="/account" style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', letterSpacing: '0.04em' }}>My Account</Link>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.04em' }}>
          Powered by <span style={{ color: '#29C5CC' }}>Outsyde</span>
        </div>
      </div>
    </footer>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [services, setServices] = useState<Service[]>([])
  const [servicesLoading, setServicesLoading] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const [heroImage, setHeroImage] = useState<string | null>(null)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    const businessId = process.env.NEXT_PUBLIC_OUTSYDE_BUSINESS_ID
    const apiUrl = process.env.NEXT_PUBLIC_OUTSYDE_API_URL
    if (!businessId || !apiUrl) {
      setServicesLoading(false)
      return
    }
    fetch(`${apiUrl}/api/businesses/${businessId}/services`)
      .then(r => r.json())
      .then(data => setServices(data.services ?? []))
      .catch(() => setServices([]))
      .finally(() => setServicesLoading(false))

    fetch(`${apiUrl}/api/businesses/${businessId}`)
      .then(r => r.json())
      .then(data => {
        const biz = data.business ?? data
        setHeroImage(biz.coverImage ?? biz.cover_image ?? null)
      })
      .catch(() => null)
  }, [])

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', color: '#4a6872', background: '#f8fafa' }}>
      <Nav scrolled={scrolled} />
      <Hero heroImage={heroImage} />
      <Services services={services} loading={servicesLoading} />
      <Why />
      <BookCTA />
      <Contact />
      <Footer />
    </div>
  )
}
