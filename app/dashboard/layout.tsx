'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/lib/auth-context'
import { isAdminEmail, VENDOR_CONFIG } from '@/lib/config'

type NavItem = {
  href: string
  label: string
  icon: ({ size, active }: { size?: number; active?: boolean }) => React.ReactElement
  exact?: boolean
  show: boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: IconGrid, exact: true, show: true },
  { href: '/dashboard/bookings', label: 'Bookings', icon: IconCalendar, show: VENDOR_CONFIG.hasBookings },
  { href: '/dashboard/orders', label: 'Orders', icon: IconBox, show: true },
  { href: '/dashboard/services', label: 'Services', icon: IconScissors, show: VENDOR_CONFIG.hasServices },
  { href: '/dashboard/products', label: 'Products', icon: IconTag, show: VENDOR_CONFIG.hasProducts },
  { href: '/dashboard/analytics', label: 'Analytics', icon: IconChart, show: VENDOR_CONFIG.hasAnalytics },
  { href: '/dashboard/subscription', label: 'Subscription', icon: IconStar, show: VENDOR_CONFIG.hasSubscription },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && (!user || !isAdminEmail(user.email))) {
      router.replace('/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0D2B35' }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#29C5CC', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (!user || !isAdminEmail(user.email)) {
    return null
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#0A2028', color: '#F5F5F5', fontFamily: 'DM Sans, sans-serif' }}>
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 lg:hidden" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: '#0D2B35', borderRight: '1px solid rgba(41,197,204,0.12)' }}
      >
        <div className="px-6 py-5 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(41,197,204,0.1)' }}>
          <Image src="/logo.png" alt="Braids With Love" width={40} height={40} className="rounded-full flex-shrink-0" style={{ objectFit: 'cover' }} />
          <div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 16, fontWeight: 600, color: '#F5F5F5', lineHeight: 1.2 }}>Braids With Love</div>
            <div style={{ fontSize: 11, color: '#29C5CC', opacity: 0.8, marginTop: 1 }}>Admin Dashboard</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {NAV_ITEMS.filter(item => item.show).map(item => {
            const isExact = item.exact === true
            const active = isExact ? pathname === item.href : pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1"
                style={{
                  background: active ? 'rgba(41,197,204,0.12)' : 'transparent',
                  color: active ? '#29C5CC' : 'rgba(245,245,245,0.65)',
                  fontSize: 14,
                  fontWeight: active ? 500 : 400,
                  textDecoration: 'none',
                }}
              >
                <Icon size={18} active={active} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(41,197,204,0.1)' }}>
          <div className="px-3 py-2 mb-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: 12, color: 'rgba(245,245,245,0.5)', marginBottom: 1 }}>Signed in as</div>
            <div style={{ fontSize: 13, color: '#F5F5F5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
          </div>
          <button
            onClick={() => { logout(); router.push('/') }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ fontSize: 13, color: 'rgba(245,245,245,0.5)', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <IconLogout size={16} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 sticky top-0 z-10" style={{ background: '#0D2B35', borderBottom: '1px solid rgba(41,197,204,0.1)' }}>
          <button onClick={() => setSidebarOpen(true)} style={{ color: '#29C5CC', background: 'transparent', border: 'none', cursor: 'pointer', padding: 6 }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
            </svg>
          </button>
          <Image src="/logo.png" alt="Braids With Love" width={28} height={28} className="rounded-full" />
          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 17, fontWeight: 600, color: '#F5F5F5' }}>Braids With Love</span>
        </header>

        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

function IconGrid({ size = 20, active = false }: { size?: number; active?: boolean }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function IconCalendar({ size = 20, active = false }: { size?: number; active?: boolean }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
    </svg>
  )
}

function IconBox({ size = 20, active = false }: { size?: number; active?: boolean }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} viewBox="0 0 24 24">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" strokeLinecap="round" />
    </svg>
  )
}

function IconScissors({ size = 20, active = false }: { size?: number; active?: boolean }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} viewBox="0 0 24 24">
      <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
      <path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12" strokeLinecap="round" />
    </svg>
  )
}

function IconTag({ size = 20, active = false }: { size?: number; active?: boolean }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} viewBox="0 0 24 24">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconChart({ size = 20, active = false }: { size?: number; active?: boolean }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} viewBox="0 0 24 24">
      <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconStar({ size = 20, active = false }: { size?: number; active?: boolean }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

function IconLogout({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}