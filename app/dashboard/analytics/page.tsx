'use client'

import { useEffect, useState } from 'react'

interface Stats {
  totalRevenue?: number
  totalOrders?: number
  totalBookings?: number
  avgOrderValue?: number
  totalCustomers?: number
  // Backend may use different field names
  total_revenue?: number
  total_orders?: number
  total_bookings?: number
  avg_order_value?: number
  total_customers?: number
}

function resolveStats(raw: Record<string, unknown>): {
  revenue: number; orders: number; bookings: number; avgOrder: number; customers: number
} {
  return {
    revenue: Number(raw.totalRevenue ?? raw.total_revenue ?? 0),
    orders: Number(raw.totalOrders ?? raw.total_orders ?? 0),
    bookings: Number(raw.totalBookings ?? raw.total_bookings ?? 0),
    avgOrder: Number(raw.avgOrderValue ?? raw.avg_order_value ?? 0),
    customers: Number(raw.totalCustomers ?? raw.total_customers ?? 0),
  }
}

function fmtMoney(cents: number) {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245,245,245,0.07)' }}>
      <div style={{ fontSize: 12, color: 'rgba(245,245,245,0.45)', marginBottom: 10, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 26, fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, color: '#F5F5F5' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'rgba(245,245,245,0.35)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<ReturnType<typeof resolveStats> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [payoutsLoading, setPayoutsLoading] = useState(false)

  async function loadStats() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/analytics/stats')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setStats(resolveStats(data))
    } catch {
      setError('Could not load analytics.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadStats() }, [])

  async function openPayouts() {
    setPayoutsLoading(true)
    try {
      const res = await fetch('/api/admin/stripe-dashboard-link')
      const { url } = await res.json()
      if (url) window.open(url, '_blank')
    } catch {
      alert('Could not open payout dashboard. Please try again.')
    } finally {
      setPayoutsLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 600, color: '#F5F5F5', margin: 0 }}>Analytics</h1>
          <p style={{ fontSize: 14, color: 'rgba(245,245,245,0.5)', marginTop: 4 }}>Business performance overview</p>
        </div>
        <button
          onClick={openPayouts}
          disabled={payoutsLoading}
          style={{ fontSize: 13, padding: '8px 18px', borderRadius: 8, border: 'none', background: '#C9A84C', color: '#0D0D0D', fontWeight: 600, cursor: payoutsLoading ? 'not-allowed' : 'pointer', opacity: payoutsLoading ? 0.7 : 1 }}
        >
          {payoutsLoading ? 'Opening…' : 'Manage Payouts'}
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245,245,245,0.07)' }}>
              <div style={{ height: 12, width: 80, borderRadius: 4, background: 'rgba(255,255,255,0.07)', marginBottom: 14 }} />
              <div style={{ height: 28, width: 120, borderRadius: 4, background: 'rgba(255,255,255,0.07)' }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl p-10 text-center mb-8" style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
          <p style={{ color: '#F87171', marginBottom: 12 }}>{error}</p>
          <button onClick={loadStats} style={{ fontSize: 13, color: '#29C5CC', background: 'transparent', border: '1px solid rgba(41,197,204,0.3)', borderRadius: 8, padding: '6px 16px', cursor: 'pointer' }}>Try again</button>
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Revenue" value={fmtMoney(stats.revenue)} />
          <StatCard label="Bookings" value={String(stats.bookings)} sub="all time" />
          <StatCard label="Orders" value={String(stats.orders)} sub="all time" />
          <StatCard label="Avg Order" value={stats.avgOrder ? fmtMoney(stats.avgOrder) : '—'} />
        </div>
      ) : null}

      {/* Payouts CTA */}
      <div className="rounded-xl p-6" style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)' }}>
        <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 600, color: '#F5F5F5', marginBottom: 6 }}>
          Ready to get paid?
        </div>
        <p style={{ fontSize: 14, color: 'rgba(245,245,245,0.55)', marginBottom: 16, maxWidth: 480 }}>
          Your earnings are held in your Stripe Express account. Open the payout dashboard to view your balance and initiate a transfer to your bank.
        </p>
        <button
          onClick={openPayouts}
          disabled={payoutsLoading}
          style={{ fontSize: 13, padding: '8px 20px', borderRadius: 8, border: 'none', background: '#C9A84C', color: '#0D0D0D', fontWeight: 600, cursor: 'pointer' }}
        >
          Open Payout Dashboard →
        </button>
      </div>

      {/* More analytics note */}
      <div className="mt-6 rounded-xl p-5 flex items-center gap-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(245,245,245,0.06)' }}>
        <div style={{ fontSize: 24, opacity: 0.3 }}>📊</div>
        <div>
          <div style={{ fontSize: 14, color: 'rgba(245,245,245,0.6)' }}>Detailed analytics — revenue charts, period comparisons, and CSV exports — are coming soon.</div>
        </div>
      </div>
    </div>
  )
}