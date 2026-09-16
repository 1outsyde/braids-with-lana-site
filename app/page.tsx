'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useWindowWidth } from '@/lib/useWindowWidth'
import { consumerLocationLabel } from '@/lib/serviceLocation'

// ── Types ────────────────────────────────────────────────────────────────────
interface Service {
  id: string
  name: string
  description: string
  price: number
  durationMinutes: number
  imageUrl?: string
  category?: string
  serviceLocationType?: 'business' | 'alternate' | 'customer' | 'virtual' | null
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
function Nav({ isMobile }: { isMobile: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav style={{
      position: 'absolute',
      top: 0, left: 0, right: 0,
      padding: isMobile ? '16px 20px' : '24px 64px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      zIndex: 3,
      // Subtle top fade to help nav items read on any photo
      background: 'linear-gradient(to bottom, rgba(28,16,8,0.5) 0%, transparent 100%)',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: '50%', border: '2px solid rgba(232,99,10,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(232,99,10,0.1)' }}>
          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, fontWeight: 600, color: '#E8630A', fontStyle: 'italic' }}>B</span>
        </div>
        <div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 17, fontWeight: 600, color: '#fff', lineHeight: 1.1 }}>Braids With Lana</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }}>Saint Albans, Queens, NY</div>
        </div>
      </div>

      {/* Desktop links */}
      {!isMobile && (
        <div style={{ display: 'flex', gap: 36, alignItems: 'center' }}>
          {['Services', 'Gallery', 'About', 'Contact'].map(l => (
            <a key={l} href={`#${l.toLowerCase()}`}
              style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', textDecoration: 'none', letterSpacing: '0.03em', fontWeight: 400 }}
              onMouseEnter={e => (e.currentTarget.style.color = '#E8630A')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.85)')}>{l}</a>
          ))}
        </div>
      )}

      {/* Desktop CTAs */}
      {!isMobile && (
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <Link href="/login" style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}>Sign in</Link>
          <a href="#book" style={{ background: '#E8630A', color: '#1C1008', fontSize: 13, fontWeight: 600, padding: '9px 22px', borderRadius: 3, textDecoration: 'none', letterSpacing: '0.04em', boxShadow: '0 2px 12px rgba(232,99,10,0.4)' }}>Book Now</a>
        </div>
      )}

      {/* Mobile hamburger */}
      {isMobile && (
        <button
          onClick={() => setMenuOpen(o => !o)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex', flexDirection: 'column', gap: 5, minHeight: 44, justifyContent: 'center' }}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          <span style={{ display: 'block', width: 22, height: 2, background: '#ffffff', transition: 'all 0.2s', transform: menuOpen ? 'translateY(7px) rotate(45deg)' : undefined }} />
          <span style={{ display: 'block', width: 22, height: 2, background: '#ffffff', transition: 'all 0.2s', opacity: menuOpen ? 0 : 1 }} />
          <span style={{ display: 'block', width: 22, height: 2, background: '#ffffff', transition: 'all 0.2s', transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : undefined }} />
        </button>
      )}

      {/* Mobile drawer — fixed so it overlays everything */}
      {isMobile && menuOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          background: '#1C1008',
          zIndex: 1000,
          padding: '20px 20px 32px',
        }}>
          {/* Close row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid rgba(232,99,10,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 15, color: '#E8630A', fontStyle: 'italic' }}>B</span>
              </div>
              <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 15, color: '#fff', fontWeight: 600 }}>Braids With Lana</span>
            </div>
            <button onClick={() => setMenuOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 24, lineHeight: 1, padding: '4px', minHeight: 44 }} aria-label="Close menu">×</button>
          </div>
          {['Services', 'Gallery', 'About', 'Contact'].map(l => (
            <a
              key={l}
              href={`#${l.toLowerCase()}`}
              onClick={() => setMenuOpen(false)}
              style={{ display: 'block', padding: '14px 0', fontSize: 15, color: 'rgba(255,255,255,0.85)', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.08)', fontWeight: 500 }}
            >
              {l}
            </a>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
            <Link href="/login" style={{ display: 'block', textAlign: 'center', padding: '12px', fontSize: 14, color: 'rgba(255,255,255,0.7)', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4 }}>
              Sign in
            </Link>
            <a href="#book" onClick={() => setMenuOpen(false)} style={{ display: 'block', textAlign: 'center', background: '#E8630A', color: '#1C1008', fontSize: 14, fontWeight: 600, padding: '12px', borderRadius: 4, textDecoration: 'none', letterSpacing: '0.04em' }}>
              Book Now
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}

function HeroPhoto({
  heroImage,
  heroImageFailed,
  setHeroImageFailed,
  rounded,
}: {
  heroImage: string | null
  heroImageFailed: boolean
  setHeroImageFailed?: (v: boolean) => void
  rounded?: number | string
}) {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      borderRadius: rounded ?? 24,
      background: 'linear-gradient(145deg, #E8630A 0%, #F5C518 42%, #1C1008 100%)',
    }}>
      {heroImage && !heroImageFailed ? (
        <img
          src={heroImage}
          alt="Braids With Lana"
          loading="eager"
          onError={setHeroImageFailed ? () => setHeroImageFailed(true) : undefined}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
            display: 'block',
          }}
        />
      ) : null}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: heroImage && !heroImageFailed
          ? 'linear-gradient(180deg, rgba(232,99,10,0.18) 0%, rgba(28,16,8,0.28) 100%)'
          : 'transparent',
        pointerEvents: 'none',
      }} />
    </div>
  )
}

// ── Hero ─────────────────────────────────────────────────────────────────────
function Hero({ heroImage, heroImageFailed, setHeroImageFailed }: {
  heroImage: string | null
  heroImageFailed: boolean
  setHeroImageFailed: (v: boolean) => void
}) {
  const isMobile = useWindowWidth() < 768

  return (
    <section style={{
      position: 'relative',
      width: '100%',
      backgroundColor: '#FFFAF5',
      overflow: 'hidden',
    }}>
      {/* Espresso strip so existing white Nav stays readable on cream */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: isMobile ? 76 : 92,
        background: '#1C1008',
        zIndex: 2,
      }} />

      <Nav isMobile={isMobile} />

      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'stretch',
        minHeight: isMobile ? undefined : '100vh',
        paddingTop: isMobile ? 76 : 92,
      }}>
        {/* Photo first on mobile */}
        {isMobile && (
          <div style={{ width: '100%', height: 340, padding: '16px 20px 8px' }}>
            <HeroPhoto
              heroImage={heroImage}
              heroImageFailed={heroImageFailed}
              setHeroImageFailed={setHeroImageFailed}
              rounded={20}
            />
          </div>
        )}

        {/* Left — copy */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#FFFAF5',
          padding: isMobile ? '28px 20px 48px' : '48px 64px 72px',
        }}>
          <p style={{
            fontSize: 11,
            color: '#7A5C4A',
            letterSpacing: '0.18em',
            fontWeight: 600,
            textTransform: 'uppercase' as const,
            margin: '0 0 18px',
          }}>
            BEAUTIFUL HAIR · CONFIDENCE · COMMUNITY
          </p>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: isMobile ? 42 : 72,
            fontWeight: 400,
            color: '#1C1008',
            lineHeight: 1.05,
            margin: '0 0 18px',
          }}>
            Your Next Look<br />
            <em style={{ color: '#E8630A', fontStyle: 'italic' }}>Starts Here</em>
          </h1>
          <p style={{
            fontSize: isMobile ? 15 : 17,
            color: '#7A5C4A',
            lineHeight: 1.7,
            margin: '0 0 32px',
            maxWidth: 460,
          }}>
            Professional braids, styles and more — crafted with care and experience.
          </p>
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: 12,
            alignItems: isMobile ? 'stretch' : 'center',
          }}>
            <a href="/book" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#E8630A', color: '#fff',
              borderRadius: 4, padding: '14px 28px',
              fontWeight: 700, fontSize: 15,
              textDecoration: 'none',
              boxShadow: '0 4px 18px rgba(232,99,10,0.28)',
            }}>
              Book Appointment →
            </a>
            <a href="#services" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#E8630A',
              fontSize: 14, fontWeight: 600,
              textDecoration: 'none',
              padding: isMobile ? '12px 28px' : '14px 28px',
              border: '1.5px solid #E8630A',
              borderRadius: 4,
              background: 'transparent',
            }}>
              View Services
            </a>
          </div>
        </div>

        {/* Photo on the right for desktop */}
        {!isMobile && (
          <div style={{
            flex: 1,
            padding: '32px 48px 48px 16px',
            display: 'flex',
            alignItems: 'stretch',
            minHeight: 0,
          }}>
            <HeroPhoto
              heroImage={heroImage}
              heroImageFailed={heroImageFailed}
              setHeroImageFailed={setHeroImageFailed}
              rounded={28}
            />
          </div>
        )}
      </div>
    </section>
  )
}

// ── Services ─────────────────────────────────────────────────────────────────
function Services({ services, loading }: { services: Service[]; loading: boolean }) {
  const isMobile = useWindowWidth() < 768
  const CARD_COLORS = ['#FFF3E8', '#fff5e6', '#FFF3E8', '#f5f0ff', '#FFF3E8']
  return (
    <section id="services" style={{ padding: isMobile ? '64px 0' : '96px 0', background: '#fff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '0 24px' : '0 40px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 52, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span style={{ fontSize: 12, color: '#E8630A', letterSpacing: '0.14em', fontWeight: 600, textTransform: 'uppercase' as const }}>OUR SERVICES</span>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(36px,4vw,52px)', fontWeight: 400, lineHeight: 1.1, color: '#1C1008', marginTop: 10 }}>
              Find Your Look
            </h2>
            <div style={{ width: 72, height: 3, background: '#E8630A', borderRadius: 2, marginTop: 14 }} />
          </div>
          <a href="#book" style={{ fontSize: 13, color: '#E8630A', textDecoration: 'none', fontWeight: 600, marginBottom: 8 }}>View All Services →</a>
        </div>
        {loading && (
          <div style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none' as const }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ flex: '0 0 268px', height: 340, background: '#FFFAF5', borderRadius: 12, border: '1.5px solid #F0D9C8', flexShrink: 0 }} />
            ))}
          </div>
        )}
        {!loading && services.length === 0 && (
          <div style={{ padding: '64px 0', textAlign: 'center', color: '#B5977A' }}>
            <p style={{ fontSize: 15 }}>Services coming soon.</p>
          </div>
        )}
        {!loading && services.length > 0 && (
          <div style={{
            display: isMobile ? 'flex' : 'grid',
            gridTemplateColumns: isMobile ? undefined : 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 20,
            overflowX: isMobile ? 'auto' : 'visible',
            flexWrap: isMobile ? 'nowrap' : undefined,
            paddingBottom: 12,
            scrollbarWidth: 'none' as const,
          }}>
            {services.map((s, i) => (
              <div key={s.id} style={{
                flex: isMobile ? '0 0 268px' : undefined,
                background: '#fff',
                borderRadius: 12,
                overflow: 'hidden',
                border: '1.5px solid #F0D9C8',
                cursor: 'pointer',
                transition: 'all 0.25s',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#E8630A'; el.style.transform = 'translateY(-6px)'; el.style.boxShadow = '0 12px 32px rgba(232,99,10,0.15)' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#F0D9C8'; el.style.transform = 'translateY(0)'; el.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)' }}>
                {/* Image area */}
                <div style={{ height: 180, overflow: 'hidden', position: 'relative' }}>
                  {s.imageUrl
                    ? <img src={s.imageUrl} alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', background: CARD_COLORS[i % CARD_COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E8630A', opacity: 0.5, fontSize: 32 }}>✂</div>
                  }
                  {s.category && (
                    <div style={{ position: 'absolute', top: 12, left: 12, background: '#E8630A', borderRadius: 20, padding: '3px 12px', fontSize: 10, color: '#fff', fontWeight: 600, letterSpacing: '0.06em' }}>{s.category}</div>
                  )}
                </div>
                {/* Body */}
                <div style={{ padding: '20px 20px 24px' }}>
                  <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 21, fontWeight: 600, color: '#1C1008', lineHeight: 1.2, marginBottom: 8 }}>{s.name}</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: '#E8630A', fontWeight: 700, fontSize: 16, whiteSpace: 'nowrap' }}>From {fmtPrice(s.price)}</span>
                    <Link href={`/book?serviceId=${s.id}`} style={{ color: '#E8630A', fontSize: 20, fontWeight: 600, textDecoration: 'none', lineHeight: 1 }}>
                      →
                    </Link>
                  </div>
                  <p style={{ fontSize: 11, color: '#B5977A', marginTop: 10 }}>⏱ {fmtDur(s.durationMinutes)} · {consumerLocationLabel(s.serviceLocationType)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// ── Stylist bio ───────────────────────────────────────────────────────────────
function Stylist({ heroImage, heroImageFailed }: { heroImage: string | null; heroImageFailed: boolean }) {
  const isMobile = useWindowWidth() < 768
  return (
    <section id="about" style={{ padding: isMobile ? '64px 24px' : '96px 40px', background: '#FFFAF5' }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: isMobile ? 36 : 72,
        alignItems: 'center',
      }}>
        <div style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1 / 1',
          maxWidth: isMobile ? '100%' : 520,
        }}>
          <HeroPhoto heroImage={heroImage} heroImageFailed={heroImageFailed} rounded={24} />
          <div style={{
            position: 'absolute',
            left: 20,
            right: 20,
            bottom: 24,
            fontFamily: 'Cormorant Garamond, serif',
            fontStyle: 'italic',
            fontSize: isMobile ? 26 : 32,
            color: '#fff',
            textShadow: '0 2px 16px rgba(28,16,8,0.45)',
            lineHeight: 1.2,
          }}>
            More Than Just Hair ♡
          </div>
        </div>
        <div>
          <span style={{ fontSize: 12, color: '#E8630A', letterSpacing: '0.14em', fontWeight: 600, textTransform: 'uppercase' as const }}>MEET YOUR STYLIST</span>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: isMobile ? 32 : 44,
            fontWeight: 400,
            color: '#1C1008',
            lineHeight: 1.15,
            margin: '14px 0 20px',
          }}>
            Hair has always been more than a service.
          </h2>
          <p style={{ fontSize: 15, color: '#7A5C4A', lineHeight: 1.85, marginBottom: 28, maxWidth: 480 }}>
            For more than 10 years, Lana has been braiding with intention — protecting edges, honoring texture, and making space for every client to feel seen. What started as a gift in the community is now a studio built on care, conversation, and looks that last.
          </p>
          <a href="#contact" style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: '#E8630A',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            padding: '12px 24px',
            borderRadius: 4,
            textDecoration: 'none',
            letterSpacing: '0.02em',
          }}>
            Learn More →
          </a>
        </div>
      </div>
    </section>
  )
}

// ── Recent work ───────────────────────────────────────────────────────────────
function Gallery({ heroImage, heroImageFailed }: { heroImage: string | null; heroImageFailed: boolean }) {
  const isMobile = useWindowWidth() < 768
  const overlays = [0.12, 0.22, 0.32, 0.42]
  return (
    <section id="gallery" style={{ padding: isMobile ? '64px 24px' : '96px 40px', background: '#fff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span style={{ fontSize: 12, color: '#E8630A', letterSpacing: '0.14em', fontWeight: 600, textTransform: 'uppercase' as const }}>OUR WORK</span>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(36px,4vw,52px)', fontWeight: 400, color: '#1C1008', margin: '10px 0 8px' }}>
              Recent Work
            </h2>
            <p style={{ fontSize: 15, color: '#7A5C4A' }}>Real people. Real styles. Real love.</p>
          </div>
          <a href="#gallery" style={{ fontSize: 13, color: '#E8630A', textDecoration: 'none', fontWeight: 600 }}>See More →</a>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
          gap: 12,
        }}>
          {overlays.map((opacity, i) => (
            <div
              key={i}
              style={{
                position: 'relative',
                aspectRatio: '1 / 1',
                overflow: 'hidden',
                borderRadius: 8,
                background: 'linear-gradient(145deg, #E8630A 0%, #F5C518 42%, #1C1008 100%)',
              }}
              onMouseEnter={e => { const o = e.currentTarget.querySelector('[data-overlay]') as HTMLElement | null; if (o) o.style.background = 'rgba(28,16,8,0.45)' }}
              onMouseLeave={e => { const o = e.currentTarget.querySelector('[data-overlay]') as HTMLElement | null; if (o) o.style.background = `rgba(28,16,8,${opacity})` }}
            >
              {heroImage && !heroImageFailed ? (
                <img
                  src={heroImage}
                  alt="Recent work"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : null}
              <div
                data-overlay
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `rgba(28,16,8,${opacity})`,
                  transition: 'background 0.25s',
                  pointerEvents: 'none',
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── CTA Banner ────────────────────────────────────────────────────────────────
function BookCTA() {
  const isMobile = useWindowWidth() < 768
  return (
    <section id="book" style={{ background: '#1C1008', padding: isMobile ? '64px 24px' : '100px 40px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr auto', gap: isMobile ? 36 : 64, alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 32, height: 2, background: '#E8630A', borderRadius: 1 }} />
            <span style={{ fontSize: 12, color: '#E8630A', letterSpacing: '0.1em', fontWeight: 600, textTransform: 'uppercase' as const }}>Ready to book?</span>
          </div>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(36px,5vw,64px)', fontWeight: 300, lineHeight: 1.05, color: '#fff', marginBottom: 16 }}>
            Your next look<br /><em style={{ color: '#E8630A', fontWeight: 400 }}>starts here.</em>
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, maxWidth: 480 }}>
            Pick your style, choose a date, pay securely. Address confirmed after booking.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'stretch' : 'center', gap: 14 }}>
          <Link href="/book" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: '#E8630A', color: '#fff', fontSize: 15, fontWeight: 600, padding: '16px 36px', borderRadius: 3, textDecoration: 'none', letterSpacing: '0.03em', boxShadow: '0 4px 24px rgba(232,99,10,0.4)', whiteSpace: 'nowrap' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            Book your appointment
          </Link>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em', textAlign: 'center' }}>No DMs · No waiting · Earn rewards</span>
        </div>
      </div>
    </section>
  )
}

// ── Contact ───────────────────────────────────────────────────────────────────
function Contact() {
  const isMobile = useWindowWidth() < 768
  return (
    <section id="contact" style={{ padding: isMobile ? '56px 24px' : '88px 40px', background: '#fff', borderTop: '1px solid #F0D9C8' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 40 : 80, alignItems: 'start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 32, height: 2, background: '#E8630A', borderRadius: 1 }} />
            <span style={{ fontSize: 12, color: '#E8630A', letterSpacing: '0.1em', fontWeight: 600, textTransform: 'uppercase' as const }}>Get in touch</span>
          </div>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 44, fontWeight: 400, color: '#1C1008', lineHeight: 1.1, marginBottom: 20 }}>
            Questions?<br /><em style={{ color: '#7A5C4A', fontWeight: 300 }}>We&apos;re here.</em>
          </h2>
          <p style={{ fontSize: 14, color: '#7A5C4A', lineHeight: 1.85, maxWidth: 340 }}>
            Have a question about a style, pricing, or availability? Reach out — or book online and we handle the rest.
          </p>
        </div>
        <div>
          {[
            { label: 'Location', value: 'Saint Albans, Queens, NY', sub: 'Address confirmed after booking' },
            { label: 'Email', value: 'donialana15@gmail.com', sub: '' },
            { label: 'Hours', value: 'By appointment only', sub: 'Book online to see availability' },
          ].map(item => (
            <div key={item.label} style={{ borderTop: '1px solid #F0D9C8', padding: '22px 0' }}>
              <div style={{ fontSize: 10, color: '#E8630A', letterSpacing: '0.14em', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' as const }}>{item.label}</div>
              <div style={{ fontSize: 15, color: '#1C1008', fontWeight: 500, wordBreak: 'break-word' }}>{item.value}</div>
              {item.sub && <div style={{ fontSize: 12, color: '#B5977A', marginTop: 3 }}>{item.sub}</div>}
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
    <footer style={{ padding: '28px 20px', background: '#1C1008' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', border: '1.5px solid rgba(232,99,10,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 14, color: '#E8630A', fontStyle: 'italic' }}>B</span>
          </div>
          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 15, color: '#fff', fontWeight: 600 }}>Braids With Lana</span>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' as const }}>
          {['Services', 'Gallery', 'Contact'].map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', letterSpacing: '0.04em' }}>{l}</a>
          ))}
          <Link href="/account" style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', letterSpacing: '0.04em' }}>My Account</Link>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.04em' }}>
          Powered by <span style={{ color: '#E8630A' }}>Outsyde</span>
        </div>
      </div>
    </footer>
  )
}

// ── Meet Your Stylist ─────────────────────────────────────────────────────────
function MeetStylist({ photo, fallback }: { photo: string | null; fallback: string | null }) {
  const isMobile = useWindowWidth() < 768
  const img = photo ?? fallback
  return (
    <section id="about" style={{ padding: isMobile ? '72px 24px' : '96px 40px', background: '#1C1008' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 40 : 80, alignItems: 'center' }}>
        <div style={{ order: isMobile ? 1 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 32, height: 2, background: '#E8630A', borderRadius: 1 }} />
            <span style={{ fontSize: 12, color: '#E8630A', letterSpacing: '0.1em', fontWeight: 600, textTransform: 'uppercase' as const }}>Meet your stylist</span>
          </div>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(36px,4vw,52px)', fontWeight: 400, color: '#fff', lineHeight: 1.1, marginBottom: 20 }}>
            Hi, I&apos;m <em style={{ color: '#E8630A' }}>Lana.</em>
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.85, maxWidth: 420, marginBottom: 28 }}>
            I&apos;ve been braiding hair in Saint Albans, Queens for years — specializing in knotless braids, box braids, and faux locs that protect your hair and last.
          </p>
          <a href="/book" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#E8630A', color: '#fff', fontSize: 13, fontWeight: 600, padding: '11px 24px', borderRadius: 4, textDecoration: 'none', letterSpacing: '0.04em' }}>
            Book with Lana →
          </a>
        </div>
        <div style={{ order: isMobile ? 0 : 1 }}>
          {img ? (
            <img
              src={img}
              alt="Lana, your stylist"
              style={{ width: '100%', maxWidth: 420, height: isMobile ? 300 : 440, objectFit: 'cover', borderRadius: 12, display: 'block', border: '1.5px solid rgba(232,99,10,0.2)' }}
            />
          ) : (
            <div style={{ width: '100%', maxWidth: 420, height: isMobile ? 300 : 440, borderRadius: 12, background: 'rgba(232,99,10,0.08)', border: '1.5px dashed rgba(232,99,10,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 40, color: 'rgba(232,99,10,0.4)', fontStyle: 'italic' }}>Lana</span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// ── Recent Work Gallery ───────────────────────────────────────────────────────
function RecentWorkGallery({ photos, fallback }: { photos: (string | null)[]; fallback: string | null }) {
  const isMobile = useWindowWidth() < 768
  const slots = photos.slice(0, 4)
  const hasPhotos = slots.some(p => p !== null)
  if (!hasPhotos) return null
  return (
    <section id="gallery" style={{ padding: isMobile ? '72px 24px' : '96px 40px', background: '#FFFAF5' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
          <div style={{ width: 32, height: 2, background: '#E8630A', borderRadius: 1 }} />
          <span style={{ fontSize: 12, color: '#E8630A', letterSpacing: '0.1em', fontWeight: 600, textTransform: 'uppercase' as const }}>Recent work</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 12 }}>
          {slots.map((photo, i) => {
            const src = photo ?? fallback
            return src ? (
              <img
                key={i}
                src={src}
                alt={`Recent work ${i + 1}`}
                style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: 8, border: '1.5px solid #F0D9C8', display: 'block' }}
              />
            ) : null
          })}
        </div>
      </div>
    </section>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [services, setServices] = useState<Service[]>([])
  const [servicesLoading, setServicesLoading] = useState(true)
  const [heroImage, setHeroImage] = useState<string | null>(null)
  const [heroImageFailed, setHeroImageFailed] = useState(false)
  const [stylistPhoto, setStylistPhoto] = useState<string | null>(null)
  const [galleryPhotos, setGalleryPhotos] = useState<(string | null)[]>([null, null, null, null])

  useEffect(() => {
    const controller = new AbortController()
    const signal = controller.signal

    fetch('/api/bookings/services', { signal })
      .then(r => r.json())
      .then(data => setServices(data.services ?? []))
      .catch(err => { if (err.name !== 'AbortError') setServices([]) })
      .finally(() => setServicesLoading(false))

    fetch('/api/bookings/business', { signal })
      .then(r => r.json())
      .then(data => {
        const biz = data.business ?? data
        setHeroImage(biz.coverImage ?? biz.cover_image ?? null)
        setHeroImageFailed(false)
        setStylistPhoto(biz.siteConfig?.stylistPhoto ?? null)
        setGalleryPhotos(biz.siteConfig?.galleryPhotos ?? [null, null, null, null])
      })
      .catch(err => { if (err.name === 'AbortError') return })

    const timeout = setTimeout(() => controller.abort(), 15000)

    return () => {
      controller.abort()
      clearTimeout(timeout)
    }
  }, [])

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', color: '#5C3D2E', background: '#FFFAF5' }}>
      <Hero
        heroImage={heroImage}
        heroImageFailed={heroImageFailed}
        setHeroImageFailed={setHeroImageFailed}
      />
      <Services services={services} loading={servicesLoading} />
      <Stylist heroImage={heroImage} heroImageFailed={heroImageFailed} />
      <Gallery heroImage={heroImage} heroImageFailed={heroImageFailed} />
      <BookCTA />
      <Contact />
      <Footer />
    </div>
  )
}
