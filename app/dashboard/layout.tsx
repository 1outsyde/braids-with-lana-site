'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { isAdminEmail, VENDOR_CONFIG } from '@/lib/config'

type NavItem = {
  href: string
  label: string
  exact?: boolean
  show: boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'OVERVIEW', exact: true, show: true },
  { href: '/dashboard/bookings', label: 'BOOKINGS', show: VENDOR_CONFIG.hasBookings },
  { href: '/dashboard/calendar', label: 'CALENDAR', show: VENDOR_CONFIG.hasBookings },
  { href: '/dashboard/orders', label: 'ORDERS', show: true },
  { href: '/dashboard/services', label: 'SERVICES', show: VENDOR_CONFIG.hasServices },
  { href: '/dashboard/products', label: 'PRODUCTS', show: VENDOR_CONFIG.hasProducts },
  { href: '/dashboard/availability', label: 'AVAILABILITY', show: VENDOR_CONFIG.hasBookings },
  { href: '/dashboard/analytics', label: 'ANALYTICS', show: VENDOR_CONFIG.hasAnalytics },
  { href: '/dashboard/subscription', label: 'SUBSCRIPTION', show: VENDOR_CONFIG.hasSubscription },
  { href: '/dashboard/settings', label: 'SETTINGS', show: true },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (isLoading) return
    if (!user || !isAdminEmail(user.email)) {
      router.replace('/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1C1008' }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#F5C518', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (isLoading || !user || !isAdminEmail(user.email)) return null

  return (
    <div className="min-h-screen flex" style={{ background: '#F5F7F8' }}>
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 lg:hidden" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ width: 220, background: '#1C1008', borderRight: '1px solid rgba(255,255,255,0.05)' }}
      >
        {/* Brand lockup */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Link href="/" className="flex items-center gap-3" style={{ textDecoration: 'none' }}>
            <img src="/braids-by-lana-logo-favicon.png" alt="Braids by Lana" style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 16, fontWeight: 600, color: '#F5F5F5', lineHeight: 1.2 }}>
                Braids by Lana
              </div>
              <div style={{ fontSize: 10, color: 'rgba(245,245,245,0.35)', marginTop: 2, letterSpacing: '0.1em' }}>
                ADMIN
              </div>
            </div>
          </Link>
        </div>

        {/* Nav — text only, all-caps, gold left-bar active */}
        <nav className="flex-1 overflow-y-auto py-4">
          {NAV_ITEMS.filter(i => i.show).map(item => {
            const isExact = item.exact === true
            const active = isExact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '11px 20px',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  color: active ? '#F5F5F5' : 'rgba(245,245,245,0.4)',
                  textDecoration: 'none',
                  borderLeft: `3px solid ${active ? '#F5C518' : 'transparent'}`,
                  background: active ? 'rgba(245,197,24,0.06)' : 'transparent',
                  transition: 'all 0.15s',
                }}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Sidebar footer — email only */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 11, color: 'rgba(245,245,245,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.email}
          </div>
        </div>

        {/* Sign out — pinned to sidebar bottom */}
        <button
          onClick={() => { logout(); router.push('/') }}
          style={{
            display: 'block',
            width: '100%',
            padding: '14px 20px',
            textAlign: 'left',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(245,245,245,0.28)',
            background: 'transparent',
            border: 'none',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Sign Out
        </button>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar — 52px, sticky */}
        <header
          className="lg:hidden flex items-center gap-3 sticky top-0 z-10"
          style={{ height: 52, padding: '0 16px', background: '#1C1008', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <button onClick={() => setSidebarOpen(true)} style={{ color: 'rgba(245,245,245,0.7)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, display: 'flex' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
            </svg>
          </button>
          <Link href="/" className="flex items-center gap-3" style={{ textDecoration: 'none' }}>
            <img src="/braids-by-lana-logo-favicon.png" alt="Braids by Lana" style={{ width: 28, height: 28, objectFit: 'contain' }} />
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 17, fontWeight: 600, color: '#F5F5F5' }}>
              Braids by Lana
            </span>
          </Link>
        </header>

        <main className="flex-1 p-6 lg:p-10 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
