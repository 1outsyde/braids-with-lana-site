'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

// ── Types ────────────────────────────────────────────────────────────────────

interface Stats {
  bookingCount: number
  monthlyRevenueCents: number
}

interface Appointment {
  id: string
  appointmentDate: string
  appointmentTime?: string
  status: string
  serviceName?: string
  clientName?: string
  totalPrice?: number
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatCents(cents: number) {
  return '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending:   { bg: 'rgba(201,168,76,0.15)',  color: '#C9A84C' },
  confirmed: { bg: 'rgba(41,197,204,0.15)',  color: '#29C5CC' },
  completed: { bg: 'rgba(13,43,53,0.12)',    color: '#0D2B35' },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_COLORS[status] ?? { bg: 'rgba(0,0,0,0.07)', color: 'rgba(0,0,0,0.5)' }
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 10,
      background: s.bg, color: s.color, textTransform: 'capitalize', letterSpacing: '0.02em',
    }}>
      {status}
    </span>
  )
}

// ── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      border: '1px solid #e8f0f1', padding: '24px',
    }}>
      <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#6b8c94', marginBottom: 8, fontWeight: 500 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 34, fontWeight: 600, color: '#0D2B35', lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: 'rgba(0,0,0,0.35)', marginTop: 6 }}>
          {sub}
        </div>
      )}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [serviceCount, setServiceCount] = useState<number | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, servicesRes, apptsRes] = await Promise.all([
          fetch('/api/dashboard/stats', { cache: 'no-store' }),
          fetch('/api/bookings/services', { cache: 'no-store' }),
          fetch('/api/dashboard/appointments-today', { cache: 'no-store' }),
        ])

        const [statsData, servicesData, apptsData] = await Promise.all([
          statsRes.json().catch(() => ({})),
          servicesRes.json().catch(() => ({})),
          apptsRes.json().catch(() => ({ appointments: [] })),
        ])

        setStats(statsData?.stats ?? null)
        setServiceCount(Array.isArray(servicesData?.services) ? servicesData.services.length : null)
        setAppointments(apptsData?.appointments ?? [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const showAddServiceCTA = !loading && serviceCount === 0

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 38, fontWeight: 600, color: '#0D2B35', margin: 0, lineHeight: 1 }}>
          {greeting()}, Braids With Love
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.4)', marginTop: 8 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 36 }}>
        <StatCard
          label="Total Bookings"
          value={loading ? '—' : String(stats?.bookingCount ?? 0)}
          sub="confirmed & completed"
        />
        <StatCard
          label="Revenue This Month"
          value={loading ? '—' : formatCents(stats?.monthlyRevenueCents ?? 0)}
          sub="orders + bookings"
        />
        <StatCard
          label="Services Listed"
          value={loading ? '—' : String(serviceCount ?? 0)}
          sub="live services"
        />
        <StatCard
          label="Today's Schedule"
          value={loading ? '—' : String(appointments.length)}
          sub="appointments today"
        />
      </div>

      {/* Quick action: no services yet */}
      {showAddServiceCTA && (
        <div style={{
          background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)',
          borderRadius: 14, padding: '16px 20px', marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 14, color: '#0D2B35' }}>You have no services listed yet.</span>
          <Link href="/dashboard/services" style={{ fontSize: 13, fontWeight: 600, color: '#C9A84C', textDecoration: 'none' }}>
            Add your first service →
          </Link>
        </div>
      )}

      {/* Today's appointments */}
      <div style={{
        background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        border: '1px solid #e8f0f1', padding: '24px',
      }}>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 600, color: '#0D2B35', margin: '0 0 20px' }}>
          Today's Appointments
        </h2>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 56, borderRadius: 10, background: 'rgba(0,0,0,0.05)' }} />
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.4)', margin: 0 }}>
            No appointments today — enjoy your day!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {appointments.map(appt => (
              <div key={appt.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', borderRadius: 12,
                background: 'rgba(0,0,0,0.025)', border: '1px solid rgba(0,0,0,0.05)',
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#0D2B35' }}>
                    {appt.clientName || 'Client'}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', marginTop: 2 }}>
                    {appt.serviceName ?? 'Service'}{appt.appointmentTime ? ` · ${appt.appointmentTime}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {appt.totalPrice != null && (
                    <span style={{ fontSize: 14, color: '#0D2B35', fontWeight: 500 }}>
                      {formatCents(appt.totalPrice)}
                    </span>
                  )}
                  <StatusBadge status={appt.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
