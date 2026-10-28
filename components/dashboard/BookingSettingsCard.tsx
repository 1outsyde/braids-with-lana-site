'use client'

// Booking settings (Manage Business step 5): the business cancellation policy, the default deposit
// for new services, and the business terms. Same rules and routes as the Outsyde app.
//   policy   → PUT  /api/admin/cancellation-policy  (backend PUT /api/vendor/my-business/cancellation-policy)
//   deposit  → PATCH /api/admin/profile { defaultDepositCents }
//   terms    → PATCH /api/admin/profile { vendorTermsAndConditions }

import { useEffect, useState } from 'react'
import {
  REFUND_WINDOWS, depositInputFrom, parseDefaultDepositInput, policyDraftFrom, policyFromDraft, termsPayload,
  type BusinessPolicyFields, type PolicyDraft, type RefundWindow,
} from '@/lib/manageBusiness'

export interface DashTheme {
  card: string
  border: string
  ink: string
  muted: string
  accent: string
  accentInk: string
  inputBg: string
  inputBorder: string
  inputInk: string
  danger: string
  success: string
}

type Business = BusinessPolicyFields & {
  id: string
  cancellationPolicySetAt?: string | null
  defaultDepositCents?: number | null
  vendorTermsAndConditions?: string | null
}

async function errorText(res: Response, fallback: string): Promise<string> {
  const data = await res.json().catch(() => ({}))
  const e = (data as { error?: unknown; message?: unknown }).error ?? (data as { message?: unknown }).message
  if (typeof e === 'string' && e) return e
  if (e && typeof e === 'object' && typeof (e as { message?: unknown }).message === 'string') return (e as { message: string }).message
  return fallback
}

export default function BookingSettingsCard({ t, isMobile }: { t: DashTheme; isMobile: boolean }) {
  const [biz, setBiz] = useState<Business | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [draft, setDraft] = useState<PolicyDraft>(policyDraftFrom(null))
  const [deposit, setDeposit] = useState('')
  const [terms, setTerms] = useState('')
  const [busy, setBusy] = useState<'policy' | 'deposit' | 'terms' | null>(null)
  const [msg, setMsg] = useState<{ part: 'policy' | 'deposit' | 'terms'; ok: boolean; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/admin/business', { cache: 'no-store' })
      .then(async r => {
        if (r.status === 401 || r.status === 403 || r.status === 404) throw new Error('Sign in with the business owner account to change booking settings.')
        if (!r.ok) throw new Error('Booking settings could not be loaded. Refresh to try again.')
        return r.json()
      })
      .then((data: { business?: Business }) => {
        const b = data.business ?? null
        if (!b) throw new Error('Booking settings could not be loaded. Refresh to try again.')
        setBiz(b)
        setDraft(policyDraftFrom(b))
        setDeposit(depositInputFrom(b.defaultDepositCents))
        setTerms(b.vendorTermsAndConditions ?? '')
      })
      .catch((e: unknown) => setLoadError(e instanceof Error ? e.message : 'Booking settings could not be loaded.'))
  }, [])

  const set = <K extends keyof PolicyDraft>(k: K, v: PolicyDraft[K]) => { setDraft(d => ({ ...d, [k]: v })); setMsg(null) }

  async function savePolicy() {
    const parsed = policyFromDraft(draft)
    if ('error' in parsed) { setMsg({ part: 'policy', ok: false, text: parsed.error }); return }
    setBusy('policy'); setMsg(null)
    try {
      const res = await fetch('/api/admin/cancellation-policy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.policy),
      })
      if (!res.ok) throw new Error(await errorText(res, 'Could not save your cancellation policy.'))
      const data = await res.json().catch(() => ({})) as { business?: Business }
      if (data.business) { setBiz(data.business); setDraft(policyDraftFrom(data.business)) }
      setMsg({ part: 'policy', ok: true, text: 'Cancellation policy saved. New services use it.' })
    } catch (e) {
      setMsg({ part: 'policy', ok: false, text: e instanceof Error ? e.message : 'Could not save your cancellation policy.' })
    } finally { setBusy(null) }
  }

  async function saveDeposit() {
    const parsed = parseDefaultDepositInput(deposit)
    if ('error' in parsed) { setMsg({ part: 'deposit', ok: false, text: parsed.error }); return }
    setBusy('deposit'); setMsg(null)
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultDepositCents: parsed.cents }),
      })
      if (!res.ok) throw new Error(await errorText(res, 'Could not save your default deposit.'))
      setDeposit(depositInputFrom(parsed.cents))
      setMsg({ part: 'deposit', ok: true, text: parsed.cents ? 'Saved. New services start with this deposit.' : 'Saved. New services start with no deposit.' })
    } catch (e) {
      setMsg({ part: 'deposit', ok: false, text: e instanceof Error ? e.message : 'Could not save your default deposit.' })
    } finally { setBusy(null) }
  }

  async function saveTerms() {
    setBusy('terms'); setMsg(null)
    try {
      const body = termsPayload(terms)
      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(await errorText(res, 'Could not save your terms.'))
      setTerms(body.vendorTermsAndConditions ?? '')
      setMsg({ part: 'terms', ok: true, text: body.vendorTermsAndConditions ? 'Terms saved.' : 'Terms removed.' })
    } catch (e) {
      setMsg({ part: 'terms', ok: false, text: e instanceof Error ? e.message : 'Could not save your terms.' })
    } finally { setBusy(null) }
  }

  const card: React.CSSProperties = { background: t.card, border: `1.5px solid ${t.border}`, borderRadius: 12, padding: isMobile ? '24px 20px' : '28px 32px', marginTop: 24 }
  const h2: React.CSSProperties = { fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 600, color: t.ink, margin: '0 0 6px' }
  const h3: React.CSSProperties = { fontFamily: 'Cormorant Garamond, serif', fontSize: 19, fontWeight: 600, color: t.ink, margin: '0 0 4px' }
  const help: React.CSSProperties = { fontSize: 13, color: t.muted, margin: '0 0 14px', lineHeight: 1.6 }
  const input: React.CSSProperties = { fontSize: 14, padding: '9px 12px', borderRadius: 8, border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.inputInk, outline: 'none', boxSizing: 'border-box' }
  const btn = (disabled: boolean): React.CSSProperties => ({ fontSize: 13, padding: '9px 20px', borderRadius: 8, border: 'none', background: t.accent, color: t.accentInk, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1, minHeight: 40 })
  const row: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }
  const lbl: React.CSSProperties = { fontSize: 13, color: t.ink }
  const divider: React.CSSProperties = { borderTop: `1px solid ${t.border}`, margin: '24px 0' }
  const note = (part: 'policy' | 'deposit' | 'terms') =>
    msg?.part === part ? <p role="status" style={{ fontSize: 13, margin: '10px 0 0', color: msg.ok ? t.success : t.danger }}>{msg.text}</p> : null

  const windowSelect = (value: RefundWindow, onChange: (v: RefundWindow) => void, id: string) => (
    <select id={id} value={value} onChange={e => onChange(e.target.value as RefundWindow)} style={{ ...input, minWidth: 130 }}>
      {REFUND_WINDOWS.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
    </select>
  )

  return (
    <section id="booking" style={card} aria-labelledby="booking-settings-title">
      <h2 id="booking-settings-title" style={h2}>Booking Settings</h2>
      <p style={help}>Your cancellation policy, the deposit new services start with, and your business terms. These are the same settings as in the Outsyde app.</p>

      {loadError ? (
        <p style={{ fontSize: 13, color: t.danger, margin: 0 }}>{loadError}</p>
      ) : !biz ? (
        <p style={{ fontSize: 13, color: t.muted, margin: 0 }}>Loading booking settings…</p>
      ) : (
        <>
          <h3 style={h3}>Cancellation policy</h3>
          <p style={help}>
            {biz.cancellationPolicySetAt ? 'New services copy this policy. Services you already have keep their own.' : 'You have not chosen a policy yet. Until you do, customers get no refund when they cancel.'}
          </p>
          <div style={row}>
            <label htmlFor="full-window" style={lbl}>Full refund if they cancel at least</label>
            {windowSelect(draft.fullRefundWindow, v => set('fullRefundWindow', v), 'full-window')}
            <span style={lbl}>before{draft.fullRefundWindow === 'never' ? ' (no full refunds)' : ''}</span>
          </div>
          <div style={row}>
            <label style={{ ...lbl, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={draft.hasPartialRefund} onChange={e => set('hasPartialRefund', e.target.checked)} /> Give part back after that
            </label>
          </div>
          {draft.hasPartialRefund && (
            <div style={{ ...row, paddingLeft: 24 }}>
              <input aria-label="Percent customers get back" type="number" min="1" max="100" value={draft.partialPercentInput} onChange={e => set('partialPercentInput', e.target.value)} style={{ ...input, width: 80 }} />
              <label htmlFor="partial-window" style={lbl}>% back if they cancel at least</label>
              {windowSelect(draft.partialRefundWindow, v => set('partialRefundWindow', v), 'partial-window')}
              <span style={lbl}>before</span>
            </div>
          )}
          <div style={row}>
            <label style={{ ...lbl, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={draft.hasCancellationFee} onChange={e => set('hasCancellationFee', e.target.checked)} /> Charge a cancellation fee
            </label>
          </div>
          {draft.hasCancellationFee && (
            <div style={{ ...row, paddingLeft: 24 }}>
              <select aria-label="Fee type" value={draft.cancellationFeeType} onChange={e => set('cancellationFeeType', e.target.value as 'flat' | 'percentage')} style={input}>
                <option value="flat">Flat amount ($)</option>
                <option value="percentage">Percent of the price (%)</option>
              </select>
              <input aria-label="Cancellation fee" inputMode="decimal" value={draft.feeInput} onChange={e => set('feeInput', e.target.value)} placeholder={draft.cancellationFeeType === 'flat' ? '20.00' : '20'} style={{ ...input, width: 110 }} />
            </div>
          )}
          <button type="button" onClick={savePolicy} disabled={busy !== null} style={btn(busy !== null)}>{busy === 'policy' ? 'Saving…' : 'Save cancellation policy'}</button>
          {note('policy')}

          <div style={divider} />
          <h3 style={h3}>Default deposit</h3>
          <p style={help}>New services start with this deposit, and you can change it on each one. It never changes services you already have. Leave it empty for no deposit. The smallest deposit is $7.</p>
          <div style={row}>
            <span style={lbl}>$</span>
            <input aria-label="Default deposit in dollars" inputMode="decimal" value={deposit} onChange={e => { setDeposit(e.target.value); setMsg(null) }} placeholder="No deposit" style={{ ...input, width: 140 }} />
            <button type="button" onClick={saveDeposit} disabled={busy !== null} style={btn(busy !== null)}>{busy === 'deposit' ? 'Saving…' : 'Save deposit'}</button>
          </div>
          {note('deposit')}

          <div style={divider} />
          <h3 style={h3}>Business terms</h3>
          <p style={help}>Customers see these on your Outsyde page and when they book with you in the Outsyde app.</p>
          <textarea aria-label="Business terms" rows={5} value={terms} onChange={e => { setTerms(e.target.value); setMsg(null) }} maxLength={5000} style={{ ...input, width: '100%', resize: 'vertical', marginBottom: 12 }} />
          <button type="button" onClick={saveTerms} disabled={busy !== null} style={btn(busy !== null)}>{busy === 'terms' ? 'Saving…' : 'Save terms'}</button>
          {note('terms')}
        </>
      )}
    </section>
  )
}
