'use client'

import { useState } from 'react'
import { C } from './theme'
import ServiceChecklistModal, { type ChecklistService } from './ServiceChecklistModal'
import { addonLibraryApi, describeAttach, money } from '@/lib/addonLibrary'

// Shown under each add-on in the Services tab editor:
//  - "Apply to other services": puts this add-on on the services she ticks
//    (nothing is added anywhere unless she picks it)
//  - the one-time "Library price is now $X" prompt when this service charges its own price

export interface ServiceAddonWithLibrary {
  id: string
  name: string
  priceCents: number
  businessAddonId?: string | null
  libraryPriceCents?: number | null
  needsPriceReview?: boolean
}

interface Props {
  serviceId: string
  addon: ServiceAddonWithLibrary
  allServices: Array<{ id: string; name: string; status?: string }>
  onChanged: () => void
}

export default function ServiceAddonLibraryTools({ serviceId, addon, allServices, onChanged }: Props) {
  const [picking, setPicking] = useState<ChecklistService[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const libraryId = addon.businessAddonId ?? null
  if (!libraryId) return null
  const libraryPrice = addon.libraryPriceCents ?? null
  const nameOf = (id: string) => allServices.find((s) => s.id === id)?.name ?? 'a service'

  async function openPicker() {
    setError(null); setMessage(null); setBusy(true)
    try {
      const library = await addonLibraryApi.list()
      const attached = new Set(library.find((a) => a.id === libraryId)?.services.map((s) => s.serviceId) ?? [])
      attached.add(serviceId)
      setPicking(
        allServices
          .filter((s) => s.status !== 'archived' && !attached.has(s.id))
          .map((s) => ({ id: s.id, name: s.name })),
      )
    } catch (e) {
      setMessage((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function attach(ids: string[]) {
    setBusy(true); setError(null)
    try {
      const result = await addonLibraryApi.attach(libraryId!, ids)
      setPicking(null)
      setMessage(describeAttach(result, nameOf))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function review(action: 'sync' | 'keep') {
    setBusy(true); setMessage(null)
    try {
      await addonLibraryApi.priceReview(serviceId, addon.id, action)
      onChanged()
    } catch (e) {
      setMessage((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const linkBtn: React.CSSProperties = { fontSize: 12, background: 'none', border: 'none', padding: 0, color: C.accent, cursor: 'pointer', fontWeight: 600 }
  const smallBtn: React.CSSProperties = { fontSize: 11, padding: '3px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, cursor: 'pointer' }

  return (
    <div style={{ padding: '4px 12px 2px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      {addon.needsPriceReview && libraryPrice != null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: C.text }}>
            Library price is now {money(libraryPrice)}. This service charges {money(addon.priceCents)}.
          </span>
          <button type="button" disabled={busy} onClick={() => review('sync')} style={{ ...smallBtn, borderColor: C.accent, color: C.accent }}>
            Use {money(libraryPrice)}
          </button>
          <button type="button" disabled={busy} onClick={() => review('keep')} style={smallBtn}>
            Keep {money(addon.priceCents)}
          </button>
        </div>
      )}
      <div>
        <button type="button" disabled={busy} onClick={openPicker} style={linkBtn}>
          Apply to other services
        </button>
      </div>
      {message && <span style={{ fontSize: 12, color: C.muted }}>{message}</span>}

      {picking && (
        <ServiceChecklistModal
          title={`Add ${addon.name} to other services`}
          message="Choose the services that should also offer this add-on. Nothing is added anywhere else."
          services={picking}
          confirmLabel={(n) => `Add to ${n} service${n === 1 ? '' : 's'}`}
          emptyText="Your other active services already offer this add-on."
          busy={busy}
          error={error}
          onConfirm={attach}
          onClose={() => setPicking(null)}
        />
      )}
    </div>
  )
}
