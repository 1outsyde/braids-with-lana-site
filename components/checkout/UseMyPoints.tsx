'use client'
import { useEffect, useState } from 'react'

// "Use my points" block for checkout. Outsyde loyalty rewards: 500 points = $1,
// redeemed in fixed tiers into single-use codes that the backend applies at payment.

export interface RewardCode {
  id: string
  code: string
  discountCents: number
  expiresAt?: string | null
  minimumOrderCents?: number | null
}

interface RewardTier {
  points: number
  discountCents: number
  minimumOrderCents?: number | null
}

interface PointsData {
  balance: number
  activeCodes: RewardCode[]
  tiers: RewardTier[]
}

export interface UseMyPointsTheme {
  accent: string
  accentLight: string
  text: string
  muted: string
  border: string
  card: string
  selectedBg: string
  error: string
  errorBg: string
  errorBorder: string
  font: string
}

// Codes the backend reported as in use on another booking. Kept for the rest of the page session.
export const promoInUseIds = new Set<string>()

export const PROMO_ERROR_CODES = ['INVALID_PROMO', 'PROMO_TOO_LARGE', 'PROMO_IN_USE', 'PROMO_UPDATE_FAILED', 'PROMO_CHECK_FAILED']

const MIN_TIER_POINTS = 2500
const FALLBACK_TIERS: RewardTier[] = [
  { points: 2500, discountCents: 500 },
  { points: 5000, discountCents: 1000 },
  { points: 12500, discountCents: 2500 },
  { points: 25000, discountCents: 5000 },
  { points: 50000, discountCents: 10000 },
]

export function formatRewardOff(cents: number): string {
  const dollars = cents / 100
  return `$${cents % 100 === 0 ? dollars.toFixed(0) : dollars.toFixed(2)} off`
}

function formatExpiry(iso?: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('outsyde_access_token') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function parsePoints(data: unknown): PointsData | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>
  const balance = typeof d.balance === 'number' ? d.balance : 0
  const activeCodes = Array.isArray(d.activeCodes)
    ? (d.activeCodes as RewardCode[]).filter(c => c && typeof c.id === 'string' && typeof c.discountCents === 'number')
    : []
  const tiers = Array.isArray(d.tiers) && d.tiers.length > 0
    ? (d.tiers as RewardTier[]).filter(t => t && typeof t.points === 'number' && typeof t.discountCents === 'number')
    : FALLBACK_TIERS
  return { balance, activeCodes, tiers }
}

export default function UseMyPoints({
  dueNowCents,
  selectedCodeId,
  onSelect,
  locked,
  onChange,
  reloadKey,
  theme,
}: {
  // What the customer pays now before rewards. Null when unknown.
  dueNowCents: number | null
  selectedCodeId: string | null
  onSelect: (code: RewardCode | null) => void
  // True once payment is being prepared or the card form is open.
  locked: boolean
  // Shown while locked so the customer can go back and pick again.
  onChange?: () => void
  reloadKey: number
  theme: UseMyPointsTheme
}) {
  const T = theme
  const [data, setData] = useState<PointsData | null>(null)
  const [confirmTier, setConfirmTier] = useState<RewardTier | null>(null)
  const [redeeming, setRedeeming] = useState(false)
  const [redeemError, setRedeemError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/consumer/points', { headers: authHeaders(), cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(body => { if (!cancelled) setData(parsePoints(body)) })
      .catch(() => { if (!cancelled) setData(null) })
    return () => { cancelled = true }
  }, [reloadKey])

  if (!data) return null
  if (data.activeCodes.length === 0 && data.balance < MIN_TIER_POINTS) return null

  // Booking rule: the customer still pays at least $1.00 now.
  function blockReason(discountCents: number): string | null {
    if (dueNowCents == null) return 'Not available for this booking'
    if (discountCents > dueNowCents - 100) return 'Too large for the amount due today'
    return null
  }

  const heldValues = new Set(data.activeCodes.map(c => c.discountCents))
  const affordableTiers = data.tiers
    .filter(t => data.balance >= t.points && !heldValues.has(t.discountCents))
    .sort((a, b) => a.points - b.points)

  async function redeem(tier: RewardTier) {
    setRedeeming(true)
    setRedeemError(null)
    try {
      const res = await fetch('/api/consumer/points/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ pointsToRedeem: tier.points }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok || body.success === false || typeof body.codeId !== 'string') {
        setRedeemError(typeof body.error === 'string' ? body.error : 'Could not redeem your points. Please try again.')
        return
      }
      const code: RewardCode = {
        id: body.codeId,
        code: body.code,
        discountCents: typeof body.discountCents === 'number' ? body.discountCents : tier.discountCents,
        expiresAt: body.expiresAt ?? null,
        minimumOrderCents: body.minimumOrderCents ?? null,
      }
      setConfirmTier(null)
      setData(prev => prev ? {
        ...prev,
        balance: typeof body.newBalance === 'number' ? body.newBalance : prev.balance - tier.points,
        activeCodes: [...prev.activeCodes, code],
      } : prev)
      onSelect(code)
    } catch {
      setRedeemError('Could not redeem your points. Please try again.')
    } finally {
      setRedeeming(false)
    }
  }

  const rowStyle = (active: boolean, disabled: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'flex-start', gap: 10,
    background: active ? T.selectedBg : '#fff',
    border: `1px solid ${active ? T.accent : T.border}`,
    borderRadius: 8, padding: '10px 12px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled && !active ? 0.5 : 1,
  })

  const smallBtn = (primary: boolean): React.CSSProperties => ({
    background: primary ? T.accent : 'transparent',
    color: primary ? '#fff' : T.accent,
    border: `1px solid ${T.accent}`,
    borderRadius: 6, padding: '7px 14px', fontSize: 13, fontWeight: 600,
    cursor: redeeming ? 'not-allowed' : 'pointer', fontFamily: T.font,
  })

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Use my points</div>
        {locked && onChange && (
          <button type="button" onClick={onChange} style={{ background: 'none', border: 'none', color: T.accent, fontWeight: 600, cursor: 'pointer', fontSize: 12, padding: 0, textDecoration: 'underline', fontFamily: T.font }}>
            Change
          </button>
        )}
      </div>
      <div style={{ fontSize: 12, color: T.muted, marginBottom: 12 }}>
        Outsyde loyalty rewards. You have {data.balance.toLocaleString('en-US')} points.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={rowStyle(!confirmTier && selectedCodeId === null, locked)}>
          <input
            type="radio"
            name="use-my-points"
            checked={!confirmTier && selectedCodeId === null}
            disabled={locked}
            onChange={() => { setConfirmTier(null); onSelect(null) }}
            style={{ accentColor: T.accent, marginTop: 2 }}
          />
          <span style={{ fontSize: 14, color: T.text }}>Don&apos;t use points</span>
        </label>

        {data.activeCodes.map(code => {
          const inUse = promoInUseIds.has(code.id)
          const reason = inUse ? 'In use on another booking right now' : blockReason(code.discountCents)
          const disabled = locked || reason != null
          const active = !confirmTier && selectedCodeId === code.id
          const exp = formatExpiry(code.expiresAt)
          return (
            <label key={code.id} style={rowStyle(active, disabled)}>
              <input
                type="radio"
                name="use-my-points"
                checked={active}
                disabled={disabled}
                onChange={() => { setConfirmTier(null); onSelect(code) }}
                style={{ accentColor: T.accent, marginTop: 2 }}
              />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: T.text }}>{formatRewardOff(code.discountCents)}</span>
                <span style={{ display: 'block', fontSize: 12, color: reason ? T.error : T.muted, marginTop: 2 }}>
                  {reason ?? (exp ? `Reward code in your account, expires ${exp}` : 'Reward code in your account')}
                </span>
              </span>
            </label>
          )
        })}

        {affordableTiers.map(tier => {
          const reason = blockReason(tier.discountCents)
          const disabled = locked || redeeming || reason != null
          const confirming = confirmTier?.points === tier.points
          return (
            <div key={tier.points}>
              <label style={rowStyle(confirming, disabled)}>
                <input
                  type="radio"
                  name="use-my-points"
                  checked={confirming}
                  disabled={disabled}
                  onChange={() => { setRedeemError(null); setConfirmTier(tier) }}
                  style={{ accentColor: T.accent, marginTop: 2 }}
                />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: T.text }}>
                    {tier.points.toLocaleString('en-US')} points for {formatRewardOff(tier.discountCents)}
                  </span>
                  {reason && <span style={{ display: 'block', fontSize: 12, color: T.error, marginTop: 2 }}>{reason}</span>}
                </span>
              </label>
              {confirming && !locked && (
                <div style={{ border: `1px solid ${T.border}`, borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '10px 12px', background: T.selectedBg }}>
                  <div style={{ fontSize: 13, color: T.text, marginBottom: 10, lineHeight: 1.45 }}>
                    Spend {tier.points.toLocaleString('en-US')} points for a {formatRewardOff(tier.discountCents)} reward? The code is added to your account for 30 days and applied to this booking.
                  </div>
                  {redeemError && (
                    <div style={{ background: T.errorBg, border: `1px solid ${T.errorBorder}`, borderRadius: 6, padding: '8px 12px', marginBottom: 10, color: T.error, fontSize: 12 }}>
                      {redeemError}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" disabled={redeeming} onClick={() => redeem(tier)} style={smallBtn(true)}>
                      {redeeming ? 'Redeeming…' : 'Use points'}
                    </button>
                    <button type="button" disabled={redeeming} onClick={() => { setConfirmTier(null); setRedeemError(null) }} style={smallBtn(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
