'use client'

// "Finish setting up" (Manage Business step 5): the same checklist as the Outsyde app,
// from GET /api/admin/setup-status (backend GET /api/vendor/setup-status). Hidden when everything
// is done or the checklist can't be loaded, so it never gets in the way of the dashboard.

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { siteSetupSteps, type SetupStatus, type SiteSetupStep } from '@/lib/manageBusiness'
import type { DashTheme } from './BookingSettingsCard'

export default function SetupChecklistCard({ t, pages }: { t: DashTheme; pages: { products: boolean; services: boolean } }) {
  const [steps, setSteps] = useState<SiteSetupStep[] | null>(null)

  useEffect(() => {
    fetch('/api/admin/setup-status', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then((data: SetupStatus | null) => setSteps(siteSetupSteps(data, pages)))
      .catch(() => setSteps(null))
    // pages is a constant from the site config
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!steps || steps.length === 0 || steps.every(s => s.done)) return null
  const done = steps.filter(s => s.done).length

  return (
    <section aria-labelledby="setup-title" style={{ background: t.card, border: `1.5px solid ${t.border}`, borderRadius: 16, padding: '20px 24px', marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
        <h2 id="setup-title" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 600, color: t.ink, margin: 0 }}>Finish setting up</h2>
        <span style={{ fontSize: 13, color: t.muted }}>{done} of {steps.length} done</span>
      </div>
      <div aria-hidden style={{ height: 6, borderRadius: 3, background: t.border, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ width: `${Math.round((done / steps.length) * 100)}%`, height: '100%', background: t.accent }} />
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {steps.map(s => (
          <li key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: s.done ? t.muted : t.ink, minHeight: 32 }}>
            <span aria-hidden style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, border: `1.5px solid ${s.done ? t.success : t.border}`, color: t.success }}>
              {s.done ? '✓' : ''}
            </span>
            <span style={{ flex: 1, textDecoration: s.done ? 'line-through' : 'none' }}>
              {s.label}<span className="sr-only">{s.done ? ' (done)' : ' (to do)'}</span>
            </span>
            {!s.done && (s.href ? (
              <Link href={s.href} style={{ fontSize: 13, color: t.accent, fontWeight: 600, textDecoration: 'none', padding: '6px 0' }}>Do it</Link>
            ) : (
              <span style={{ fontSize: 12, color: t.muted }}>In the Outsyde app</span>
            ))}
          </li>
        ))}
      </ul>
    </section>
  )
}
