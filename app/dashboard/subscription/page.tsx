'use client'

import { useEffect, useState } from 'react'

interface Subscription {
  planName?: string
  plan_name?: string
  status?: string
  price?: number
  price_cents?: number
  renewalDate?: string
  renewal_date?: string
  nextBillingDate?: string
  next_billing_date?: string
}

const TIERS = [
  { name: 'Starter', price: 29, description: 'Perfect for new vendors getting started' },
  { name: 'Growth', price: 59, description: 'For growing businesses with more volume' },
  { name: 'Pro', price: 99, description: 'Unlimited everything for established brands' },
]

function resolveSubscription(raw: Record<string, unknown>) {
  return {
    planName: String(raw.planName ?? raw.plan_name ?? raw.tierDisplayName ?? raw.tierName ?? 'Unknown'),
    status: String(raw.status ?? 'unknown'),
    priceCents: Number(raw.price ?? raw.price_cents ?? raw.priceInCents ?? 0),
    renewalDate: String(raw.renewalDate ?? raw.renewal_date ?? raw.nextBillingDate ?? raw.next_billing_date ?? raw.currentPeriodEnd ?? ''),
  }
}

export default function SubscriptionPage() {
  const [sub, setSub] = useState<ReturnType<typeof resolveSubscription> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/subscription')
        if (!res.ok) throw new Error()
        const data = await res.json()
        // API returns { subscription: { ... } }; unwrap one level if present
        const payload = data?.subscription ?? data
        setSub(resolveSubscription(payload))
      } catch {
        setError('Could not load subscription details.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const isActive = sub?.status === 'active'
  const renewalDisplay = sub?.renewalDate
    ? new Date(sub.renewalDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div>
      <div className="mb-8">
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 38, fontWeight: 600, color: '#0D2B35', margin: 0, lineHeight: 1 }}>Subscription</h1>
        <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)', marginTop: 6 }}>Manage your Outsyde plan</p>
      </div>

      {/* Current plan */}
      <div className="rounded-2xl p-6 mb-4" style={{ background: '#FFFFFF', border: '1px solid rgba(201,168,76,0.2)' }}>
        <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.4)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 12 }}>CURRENT PLAN</div>
        {loading ? (
          <div style={{ height: 36, width: 160, borderRadius: 6, background: 'rgba(0,0,0,0.07)' }} />
        ) : error ? (
          <p style={{ color: '#991B1B', fontSize: 14 }}>{error}</p>
        ) : sub ? (
          <div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 30, fontWeight: 600, color: '#0D2B35' }}>
                {sub.planName}
              </span>
              <span style={{
                fontSize: 11, padding: '3px 10px', borderRadius: 12, fontWeight: 700,
                background: isActive ? '#D1FAE5' : '#FEE2E2',
                color: isActive ? '#065F46' : '#991B1B',
              }}>
                {sub.status?.toUpperCase()}
              </span>
            </div>
            {sub.priceCents > 0 && (
              <div style={{ fontSize: 15, color: 'rgba(0,0,0,0.5)', marginTop: 8 }}>
                ${(sub.priceCents / 100).toFixed(2)}/month
              </div>
            )}
            {renewalDisplay && (
              <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.4)', marginTop: 4 }}>
                Renews {renewalDisplay}
              </div>
            )}
          </div>
        ) : null}

        <button
          onClick={() => window.open('https://www.goutsyde.com/subscription/manage', '_blank')}
          style={{ marginTop: 20, fontSize: 13, padding: '8px 18px', borderRadius: 8, border: 'none', background: '#C9A84C', color: '#0D0D0D', fontWeight: 600, cursor: 'pointer' }}
        >
          Manage Plan →
        </button>
      </div>

      {/* Available tiers */}
      <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 12 }}>AVAILABLE PLANS</div>
      <div className="grid gap-3">
        {TIERS.map(tier => {
          const isCurrent = sub?.planName?.toLowerCase().includes(tier.name.toLowerCase())
          return (
            <div
              key={tier.name}
              className="flex items-center gap-4 px-5 py-4 rounded-2xl"
              style={{
                background: '#FFFFFF',
                border: `1px solid ${isCurrent ? 'rgba(201,168,76,0.35)' : 'rgba(0,0,0,0.07)'}`,
              }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 15, fontWeight: 500, color: '#0D2B35' }}>{tier.name}</span>
                  {isCurrent && (
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#FEF3C7', color: '#92400E', fontWeight: 600 }}>
                      Current
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', marginTop: 3 }}>{tier.description}</div>
              </div>
              <div style={{ fontSize: 20, fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, color: '#C9A84C', flexShrink: 0 }}>
                ${tier.price}<span style={{ fontSize: 13, color: 'rgba(0,0,0,0.4)', fontFamily: 'DM Sans, sans-serif', fontWeight: 400 }}>/mo</span>
              </div>
            </div>
          )
        })}
      </div>

      <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.35)', marginTop: 20 }}>
        To upgrade or downgrade your plan, visit{' '}
        <a href="https://www.goutsyde.com/subscription/manage" target="_blank" rel="noopener noreferrer" style={{ color: '#0D2B35', textDecoration: 'underline', textUnderlineOffset: 3 }}>
          goutsyde.com/subscription/manage
        </a>
      </p>
    </div>
  )
}
