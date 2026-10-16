'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { C } from '@/components/addons/theme'
import ServiceChecklistModal, { type ChecklistService } from '@/components/addons/ServiceChecklistModal'
import { addonLibraryApi, describeAttach, money, type LibraryAddon } from '@/lib/addonLibrary'

// ADD-ONS tab: the vendor's add-on library. Create an add-on once, then choose
// which services offer it. Bookings always use each service's own copy, so
// nothing here changes past or in-progress bookings.

interface VendorServiceLite {
  id: string
  name: string
  status?: string
}

type FormState = { name: string; description: string; price: string; addsTime: boolean; minutes: string }
const EMPTY_FORM: FormState = { name: '', description: '', price: '', addsTime: false, minutes: '' }

type ModalState =
  | { kind: 'attach'; addon: LibraryAddon }
  | { kind: 'active'; addon: LibraryAddon; turnOn: boolean }
  | { kind: 'delete'; addon: LibraryAddon }
  | null

function formFromAddon(a: LibraryAddon): FormState {
  return {
    name: a.name,
    description: a.description ?? '',
    price: (a.priceCents / 100).toFixed(2),
    addsTime: a.durationMinutes > 0,
    minutes: a.durationMinutes > 0 ? String(a.durationMinutes) : '',
  }
}

function readForm(f: FormState): { fields?: { name: string; description: string | null; priceCents: number; durationMinutes: number }; error?: string } {
  const name = f.name.trim()
  if (!name) return { error: 'Add-on name is required.' }
  if (name.length > 80) return { error: 'Name must be 80 characters or fewer.' }
  const description = f.description.trim() || null
  if (description && description.length > 300) return { error: 'Description must be 300 characters or fewer.' }
  const price = parseFloat(f.price)
  if (isNaN(price) || price < 0 || price > 1000) return { error: 'Enter a price between $0 and $1,000.' }
  let minutes = 0
  if (f.addsTime) {
    minutes = parseInt(f.minutes.trim(), 10)
    if (isNaN(minutes) || minutes < 5 || minutes > 480) return { error: 'Extra minutes must be between 5 and 480.' }
  }
  return { fields: { name, description, priceCents: Math.round(price * 100), durationMinutes: minutes } }
}

const inputStyle: React.CSSProperties = {
  width: '100%', height: 40, padding: '0 12px', borderRadius: 8, fontSize: 14,
  border: `1px solid ${C.border}`, background: C.surface2, color: C.text, outline: 'none', boxSizing: 'border-box',
}

function AddonForm({ initial, saving, error, submitLabel, onSave, onCancel }: {
  initial: FormState; saving: boolean; error: string | null; submitLabel: string
  onSave: (f: FormState) => void; onCancel: () => void
}) {
  const [f, setF] = useState<FormState>(initial)
  return (
    <div style={{ background: C.surface2, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input aria-label="Add-on name" placeholder="Add-on name" value={f.name} maxLength={80}
        onChange={(e) => setF({ ...f, name: e.target.value })} style={{ ...inputStyle, background: C.surface }} />
      <input aria-label="Description" placeholder="Description (optional)" value={f.description} maxLength={300}
        onChange={(e) => setF({ ...f, description: e.target.value })} style={{ ...inputStyle, background: C.surface }} />
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: 140 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.accent, fontSize: 14 }}>$</span>
          <input aria-label="Price" inputMode="decimal" placeholder="0.00" value={f.price}
            onChange={(e) => setF({ ...f, price: e.target.value })} style={{ ...inputStyle, background: C.surface, paddingLeft: 24 }} />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.text, cursor: 'pointer' }}>
          <input type="checkbox" checked={f.addsTime} onChange={(e) => setF({ ...f, addsTime: e.target.checked })}
            style={{ width: 16, height: 16, accentColor: C.accent }} />
          Adds time to the appointment
        </label>
        {f.addsTime && (
          <input aria-label="Extra minutes" inputMode="numeric" placeholder="Minutes" value={f.minutes}
            onChange={(e) => setF({ ...f, minutes: e.target.value })} style={{ ...inputStyle, background: C.surface, width: 110 }} />
        )}
      </div>
      {error && <p style={{ fontSize: 12, color: C.danger, margin: 0 }}>{error}</p>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} disabled={saving}
          style={{ height: 36, padding: '0 16px', borderRadius: 8, fontSize: 13, background: 'none', color: C.muted, border: `1px solid ${C.border}`, cursor: 'pointer' }}>
          Cancel
        </button>
        <button type="button" onClick={() => onSave(f)} disabled={saving}
          style={{ height: 36, padding: '0 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: C.accent, color: C.onAccent, border: 'none', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving…' : submitLabel}
        </button>
      </div>
    </div>
  )
}

export default function AddonsPage() {
  const [addons, setAddons] = useState<LibraryAddon[]>([])
  const [services, setServices] = useState<VendorServiceLite[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState>(null)
  const [modalBusy, setModalBusy] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [reviewBusy, setReviewBusy] = useState<string | null>(null)

  async function load() {
    setLoadError(null)
    try {
      const token = localStorage.getItem('outsyde_access_token')
      const [lib, svcRes] = await Promise.all([
        addonLibraryApi.list(),
        fetch('/api/admin/services', { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
      ])
      const svcData = await svcRes.json().catch(() => ({}))
      setAddons(lib)
      setServices(Array.isArray(svcData) ? svcData : (svcData.services ?? []))
    } catch {
      setLoadError('Could not load your add-ons.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const serviceName = (id: string) =>
    services.find((s) => s.id === id)?.name
    ?? addons.flatMap((a) => a.services).find((s) => s.serviceId === id)?.serviceName
    ?? 'a service'

  async function handleCreate(f: FormState) {
    const { fields, error } = readForm(f)
    if (!fields) { setFormError(error ?? null); return }
    setSaving(true); setFormError(null)
    try {
      await addonLibraryApi.create(fields)
      await load()
      setCreating(false)
      setNotice(`"${fields.name}" is in your library. Use "Add to services" to choose where it's offered.`)
    } catch (e) {
      setFormError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function handleEdit(addon: LibraryAddon, f: FormState) {
    const { fields, error } = readForm(f)
    if (!fields) { setFormError(error ?? null); return }
    setSaving(true); setFormError(null)
    try {
      const result = await addonLibraryApi.update(addon.id, fields)
      setEditingId(null)
      const parts: string[] = [`Saved "${fields.name}".`]
      if (fields.priceCents !== addon.priceCents) {
        const n = addon.services.filter((s) => s.priceSynced).length
        parts.push(`New price ${money(fields.priceCents)} applied to ${n} service${n === 1 ? '' : 's'}.`)
        for (const s of result.customPriceServices ?? []) {
          parts.push(`${s.serviceName} kept its own price of ${money(s.priceCents)}.`)
        }
      }
      await load()
      setNotice(parts.join(' '))
    } catch (e) {
      setFormError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function handlePriceReview(addon: LibraryAddon, s: LibraryAddon['services'][number], action: 'sync' | 'keep') {
    setReviewBusy(s.addonId)
    try {
      await addonLibraryApi.priceReview(s.serviceId, s.addonId, action)
      await load()
      setNotice(action === 'sync'
        ? `${s.serviceName} now charges ${money(addon.priceCents)} for ${addon.name} and follows your library price.`
        : `${s.serviceName} keeps ${money(s.priceCents)} for ${addon.name}.`)
    } catch (e) {
      setNotice((e as Error).message)
    } finally {
      setReviewBusy(null)
    }
  }

  async function confirmModal(selectedIds: string[]) {
    if (!modal) return
    setModalBusy(true); setModalError(null)
    let message = ''
    try {
      if (modal.kind === 'attach') {
        const result = await addonLibraryApi.attach(modal.addon.id, selectedIds)
        message = `${modal.addon.name}: ${describeAttach(result, serviceName)}`
      } else if (modal.kind === 'active') {
        await addonLibraryApi.setActive(modal.addon.id, modal.turnOn, selectedIds)
        // The library add-on only counts as off when no service offers it any more.
        // The backend sets the library flag with every on/off, so put it back on when
        // some services still offer it.
        const stillOn = modal.addon.services.filter((s) => s.isActive && !selectedIds.includes(s.serviceId)).length
        if (!modal.turnOn && stillOn > 0) {
          await addonLibraryApi.setActive(modal.addon.id, true, [])
        }
        const n = selectedIds.length
        message = `${modal.addon.name} is ${modal.turnOn ? 'on' : 'off'}${n > 0 ? ` for ${n} service${n === 1 ? '' : 's'}` : ' in your library'}.`
      } else {
        const result = await addonLibraryApi.remove(modal.addon.id)
        const n = result.removedFromServiceIds?.length ?? 0
        message = `Deleted ${modal.addon.name}${n > 0 ? ` and removed it from ${n} service${n === 1 ? '' : 's'}` : ''}.`
      }
      await load()
      setModal(null)
      setNotice(message)
    } catch (e) {
      setModalError((e as Error).message)
    } finally {
      setModalBusy(false)
    }
  }

  function modalProps(m: NonNullable<ModalState>) {
    const a = m.addon
    if (m.kind === 'attach') {
      const attached = new Set(a.services.map((s) => s.serviceId))
      const list: ChecklistService[] = services
        .filter((s) => s.status !== 'archived' && !attached.has(s.id))
        .map((s) => ({ id: s.id, name: s.name }))
      return {
        title: `Add ${a.name} to services`,
        message: 'Choose the services that should offer this add-on. Nothing is added anywhere else.',
        services: list,
        confirmLabel: (n: number) => `Add to ${n} service${n === 1 ? '' : 's'}`,
        emptyText: 'All your active services already offer this add-on.',
      }
    }
    if (m.kind === 'active') {
      const list: ChecklistService[] = a.services
        .filter((s) => s.isActive !== m.turnOn)
        .map((s) => ({ id: s.serviceId, name: s.serviceName }))
      return {
        title: m.turnOn ? `Turn on ${a.name}?` : `Turn off ${a.name}?`,
        message: m.turnOn
          ? 'Choose the services where customers should see it again.'
          : 'Choose the services where customers should stop seeing it. Untick any service that should keep it.',
        services: list,
        allowEmptyConfirm: true,
        confirmLabel: (n: number) => n === 0
          ? `Turn ${m.turnOn ? 'on' : 'off'} in library only`
          : `Turn ${m.turnOn ? 'on' : 'off'} for ${n} service${n === 1 ? '' : 's'}`,
        emptyText: m.turnOn ? 'It is already on for every service it is added to.' : 'It is not switched on for any service.',
      }
    }
    return {
      title: `Delete ${a.name}?`,
      message: a.services.length > 0
        ? `It will be removed from your library and from ${a.services.length === 1 ? 'this service' : `these ${a.services.length} services`}. Past bookings keep it.`
        : 'It will be removed from your library. Past bookings keep it.',
      services: a.services.map((s) => ({ id: s.serviceId, name: s.serviceName })),
      selectable: false,
      danger: true,
      allowEmptyConfirm: true,
      confirmLabel: () => 'Delete',
      emptyText: 'It is not on any service.',
    }
  }

  const reviewCount = addons.reduce((n, a) => n + a.services.filter((s) => s.needsPriceReview).length, 0)
  const btn: React.CSSProperties = { fontSize: 12, padding: '5px 12px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, cursor: 'pointer' }

  return (
    <div style={{ maxWidth: 860 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: C.headingFont, fontSize: 38, fontWeight: 600, color: C.text, margin: 0, lineHeight: 1 }}>Add-ons</h1>
          <p style={{ fontSize: 14, color: C.muted, marginTop: 6, marginBottom: 0 }}>
            Create an add-on once, then choose which services offer it.
          </p>
        </div>
        {!creating && (
          <button type="button" onClick={() => { setCreating(true); setEditingId(null); setFormError(null) }}
            style={{ fontSize: 13, padding: '8px 18px', borderRadius: 8, border: 'none', background: C.accent, color: C.onAccent, fontWeight: 600, cursor: 'pointer' }}>
            + New add-on
          </button>
        )}
      </div>

      {notice && (
        <div role="status" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: C.accentSoft, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: C.text, margin: 0, flex: 1, lineHeight: 1.5 }}>{notice}</p>
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss"
            style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
        </div>
      )}

      {reviewCount > 0 && (
        <p style={{ fontSize: 13, color: C.text, background: C.surface, border: `1px solid ${C.accent}`, borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
          {reviewCount === 1 ? 'One service charges its own price' : `${reviewCount} services charge their own price`} for an add-on whose library price has changed. Choose to use the new price or keep the old one below.
        </p>
      )}

      {creating && (
        <div style={{ marginBottom: 16 }}>
          <AddonForm initial={EMPTY_FORM} saving={saving} error={formError} submitLabel="Create add-on"
            onSave={handleCreate} onCancel={() => { setCreating(false); setFormError(null) }} />
        </div>
      )}

      {loading ? (
        <p style={{ fontSize: 14, color: C.muted }}>Loading…</p>
      ) : loadError ? (
        <p style={{ fontSize: 14, color: C.danger }}>{loadError}</p>
      ) : addons.length === 0 ? (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
          <p style={{ fontSize: 14, color: C.text, margin: 0 }}>No add-ons yet.</p>
          <p style={{ fontSize: 13, color: C.muted, margin: '6px 0 0' }}>
            Create one here, or add one while editing a service in <Link href="/dashboard/services" style={{ color: C.accent }}>Services</Link>. Either way it lands in this list.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {addons.map((a) => (
            <div key={a.id} data-addon-name={a.name} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
              {editingId === a.id ? (
                <AddonForm initial={formFromAddon(a)} saving={saving} error={formError} submitLabel="Save changes"
                  onSave={(f) => handleEdit(a, f)} onCancel={() => { setEditingId(null); setFormError(null) }} />
              ) : (
                <>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 16, fontWeight: 600, color: a.isActive ? C.text : C.muted }}>{a.name}</span>
                        <span style={{ fontSize: 14, color: C.accent }}>+{money(a.priceCents)}</span>
                        <span style={{ fontSize: 12, color: C.muted }}>{a.durationMinutes > 0 ? `+${a.durationMinutes} min` : 'No extra time'}</span>
                        {!a.isActive && <span style={{ fontSize: 11, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 4, padding: '1px 6px' }}>OFF</span>}
                      </div>
                      {a.description && <p style={{ fontSize: 13, color: C.muted, margin: '4px 0 0' }}>{a.description}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button type="button" style={{ ...btn, borderColor: C.accent, color: C.accent }}
                        onClick={() => { setModalError(null); setModal({ kind: 'attach', addon: a }) }}>Add to services</button>
                      <button type="button" style={btn}
                        onClick={() => { setEditingId(a.id); setCreating(false); setFormError(null) }}>Edit</button>
                      {a.services.length === 0 ? (
                        <button type="button" style={btn}
                          onClick={() => addonLibraryApi.setActive(a.id, !a.isActive, []).then(() => load()).catch((e) => setNotice((e as Error).message))}>
                          {a.isActive ? 'Turn off' : 'Turn on'}
                        </button>
                      ) : (
                        <>
                          {a.services.some((s) => s.isActive) && (
                            <button type="button" style={btn}
                              onClick={() => { setModalError(null); setModal({ kind: 'active', addon: a, turnOn: false }) }}>Turn off</button>
                          )}
                          {a.services.some((s) => !s.isActive) && (
                            <button type="button" style={btn}
                              onClick={() => { setModalError(null); setModal({ kind: 'active', addon: a, turnOn: true }) }}>Turn on</button>
                          )}
                        </>
                      )}
                      <button type="button" style={{ ...btn, borderColor: C.dangerBorder, color: C.danger }}
                        onClick={() => { setModalError(null); setModal({ kind: 'delete', addon: a }) }}>Delete</button>
                    </div>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    {a.services.length === 0 ? (
                      <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>Not on any service yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontSize: 12, color: C.muted }}>On {a.services.length} service{a.services.length === 1 ? '' : 's'}:</span>
                        {a.services.map((s) => (
                          <div key={s.addonId} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', background: C.surface2, borderRadius: 8, padding: '7px 10px' }}>
                            <span style={{ fontSize: 13, color: s.isActive ? C.text : C.muted, flex: 1, minWidth: 140 }}>
                              {s.serviceName}
                              {s.serviceStatus === 'archived' && <span style={{ fontSize: 11, color: C.muted }}> (archived)</span>}
                              {!s.isActive && <span style={{ fontSize: 11, color: C.muted }}> (off)</span>}
                            </span>
                            {s.needsPriceReview ? (
                              <>
                                <span style={{ fontSize: 12, color: C.text }}>
                                  Charges {money(s.priceCents)}. Library is now {money(a.priceCents)}.
                                </span>
                                <button type="button" disabled={reviewBusy === s.addonId} style={{ ...btn, borderColor: C.accent, color: C.accent }}
                                  onClick={() => handlePriceReview(a, s, 'sync')}>Use {money(a.priceCents)}</button>
                                <button type="button" disabled={reviewBusy === s.addonId} style={btn}
                                  onClick={() => handlePriceReview(a, s, 'keep')}>Keep {money(s.priceCents)}</button>
                              </>
                            ) : !s.priceSynced && s.priceCents !== a.priceCents ? (
                              <span style={{ fontSize: 12, color: C.muted }}>Own price {money(s.priceCents)}</span>
                            ) : (
                              <span style={{ fontSize: 12, color: C.muted }}>{money(s.priceCents)}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {modal && (
        <ServiceChecklistModal
          key={`${modal.kind}-${modal.addon.id}`}
          {...modalProps(modal)}
          busy={modalBusy}
          error={modalError}
          onConfirm={confirmModal}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
