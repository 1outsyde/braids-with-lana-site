'use client'

import { useEffect, useState } from 'react'
import { BUSINESS_ID } from '@/lib/config'

// "Run past closing" (backend businesses.allow_past_closing, migration 044).
// Reads the current value from the public business endpoint and saves through the
// existing profile BFF (PATCH /api/vendor/my-business, which allowlists allowPastClosing).

export interface PastClosingTheme {
  text: string
  muted: string
  accent: string
  track: string
  border: string
  error: string
}

type Status = 'loading' | 'ready' | 'saving' | 'saved' | 'error' | 'unavailable'

export default function PastClosingToggle({ theme }: { theme: PastClosingTheme }) {
  const [enabled, setEnabled] = useState(false)
  const apiUrl = process.env.NEXT_PUBLIC_OUTSYDE_API_URL
  const [status, setStatus] = useState<Status>(apiUrl && BUSINESS_ID ? 'loading' : 'unavailable')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!apiUrl || !BUSINESS_ID) return
    fetch(`${apiUrl}/api/businesses/${BUSINESS_ID}`, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(data => {
        const biz = data?.business ?? data
        if (typeof biz?.allowPastClosing !== 'boolean') throw new Error('missing')
        setEnabled(biz.allowPastClosing)
        setStatus('ready')
      })
      .catch(() => setStatus('unavailable'))
  }, [apiUrl])

  async function toggle() {
    if (status === 'loading' || status === 'saving' || status === 'unavailable') return
    const next = !enabled
    setEnabled(next)
    setStatus('saving')
    setMessage(null)
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowPastClosing: next }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error ?? 'Save failed')
      const saved = data?.business?.allowPastClosing
      if (typeof saved === 'boolean') setEnabled(saved)
      setStatus('saved')
      setTimeout(() => setStatus(s => (s === 'saved' ? 'ready' : s)), 2500)
    } catch (e) {
      setEnabled(!next)
      setMessage(e instanceof Error ? e.message : 'Save failed')
      setStatus('error')
    }
  }

  const disabled = status === 'loading' || status === 'saving' || status === 'unavailable'

  return (
    <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${theme.border}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ minWidth: 0 }}>
          <div id="past-closing-label" style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>
            Run past closing
          </div>
          <p style={{ fontSize: 13, color: theme.muted, margin: '6px 0 0', lineHeight: 1.5 }}>
            When this is on, clients can book a service that starts during your open hours and
            finishes after you close. Bookings never run past midnight.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-labelledby="past-closing-label"
          onClick={toggle}
          disabled={disabled}
          style={{
            flexShrink: 0, width: 46, height: 26, borderRadius: 13, border: 'none', padding: 3,
            background: enabled ? theme.accent : theme.track,
            cursor: disabled ? 'default' : 'pointer',
            opacity: disabled ? 0.6 : 1,
            transition: 'background 0.2s',
            display: 'flex', justifyContent: enabled ? 'flex-end' : 'flex-start',
          }}
        >
          <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.25)' }} />
        </button>
      </div>
      <div style={{ fontSize: 12, marginTop: 8, minHeight: 16, color: status === 'error' ? theme.error : theme.muted }}>
        {status === 'loading' && 'Loading…'}
        {status === 'saving' && 'Saving…'}
        {status === 'saved' && (enabled ? 'On. Saved.' : 'Off. Saved.')}
        {status === 'error' && `Could not save. ${message ?? ''}`.trim()}
        {status === 'unavailable' && 'This setting could not be loaded. Refresh the page to try again.'}
      </div>
    </div>
  )
}
