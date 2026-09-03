'use client'

import { useEffect, useState } from 'react'

interface Service {
  id: string
  name: string
  description?: string
  price: number          // cents
  duration_minutes: number
  is_active: boolean
  category?: string
}

type FormData = {
  name: string
  description: string
  price: string          // dollars (user input)
  duration_minutes: string
  category: string
  is_active: boolean
}

const EMPTY_FORM: FormData = {
  name: '', description: '', price: '', duration_minutes: '60', category: '', is_active: true,
}

const DURATION_OPTIONS = [
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '1 hr' },
  { value: '90', label: '1.5 hrs' },
  { value: '120', label: '2 hrs' },
  { value: '150', label: '2.5 hrs' },
  { value: '180', label: '3 hrs' },
  { value: '240', label: '4 hrs' },
  { value: '300', label: '5 hrs' },
  { value: '360', label: '6 hrs' },
]

function fmtPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

function fmtDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} hr ${m} min` : `${h} hr${h > 1 ? 's' : ''}`
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function loadServices() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/services')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setServices(Array.isArray(data) ? data : (data.services ?? []))
    } catch {
      setError('Could not load services.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadServices() }, [])

  function openAdd() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setShowForm(true)
  }

  function openEdit(service: Service) {
    setEditing(service)
    setForm({
      name: service.name,
      description: service.description ?? '',
      price: (service.price / 100).toFixed(2),
      duration_minutes: String(service.duration_minutes),
      category: service.category ?? '',
      is_active: service.is_active,
    })
    setFormError(null)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError(null)
  }

  async function handleSave() {
    setFormError(null)
    if (!form.name.trim()) { setFormError('Service name is required.'); return }
    const price = parseFloat(form.price)
    if (isNaN(price) || price < 0) { setFormError('Enter a valid price.'); return }
    const duration = parseInt(form.duration_minutes)
    if (!duration || duration < 15) { setFormError('Duration must be at least 15 minutes.'); return }

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price: Math.round(price * 100),
        duration_minutes: duration,
        category: form.category.trim() || undefined,
        is_active: form.is_active,
      }

      const res = editing
        ? await fetch(`/api/admin/services/${editing.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/admin/services', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message ?? 'Save failed')
      }

      closeForm()
      await loadServices()
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Could not save service.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/services/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setDeleteConfirm(null)
      await loadServices()
    } catch {
      alert('Could not delete service. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  async function toggleActive(service: Service) {
    try {
      await fetch(`/api/admin/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !service.is_active }),
      })
      await loadServices()
    } catch {
      alert('Could not update service.')
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 600, color: '#F5F5F5', margin: 0 }}>
            Services
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(245,245,245,0.5)', marginTop: 4 }}>
            {services.length} service{services.length !== 1 ? 's' : ''} listed
          </p>
        </div>
        <button
          onClick={openAdd}
          style={{ fontSize: 13, padding: '8px 18px', borderRadius: 8, border: 'none', background: '#C9A84C', color: '#0D0D0D', fontWeight: 600, cursor: 'pointer' }}
        >
          + Add Service
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-lg rounded-2xl p-6" style={{ background: '#0D2B35', border: '1px solid rgba(41,197,204,0.2)' }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 600, color: '#F5F5F5', marginBottom: 24 }}>
              {editing ? 'Edit Service' : 'Add Service'}
            </h2>

            <div className="flex flex-col gap-4">
              <Field label="Service name *">
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Box Braids"
                  style={inputStyle}
                />
              </Field>

              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of the service…"
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </Field>

              <div className="flex gap-4">
                <Field label="Price ($) *" style={{ flex: 1 }}>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="0.00"
                    style={inputStyle}
                  />
                </Field>

                <Field label="Duration *" style={{ flex: 1 }}>
                  <select
                    value={form.duration_minutes}
                    onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    {DURATION_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                    <option value="custom">Custom</option>
                  </select>
                </Field>
              </div>

              <Field label="Category">
                <input
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  placeholder="e.g. Braids, Locs, Twists"
                  style={inputStyle}
                />
              </Field>

              <label className="flex items-center gap-3 cursor-pointer" style={{ fontSize: 14, color: 'rgba(245,245,245,0.75)' }}>
                <div
                  onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                  style={{
                    width: 42, height: 24, borderRadius: 12, position: 'relative', cursor: 'pointer',
                    background: form.is_active ? '#29C5CC' : 'rgba(245,245,245,0.15)',
                    transition: 'background 0.2s',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 3, left: form.is_active ? 21 : 3,
                    width: 18, height: 18, borderRadius: '50%', background: '#fff',
                    transition: 'left 0.2s',
                  }} />
                </div>
                Active (visible to clients)
              </label>

              {formError && (
                <p style={{ fontSize: 13, color: '#F87171', margin: 0 }}>{formError}</p>
              )}
            </div>

            <div className="flex gap-3 mt-6 justify-end">
              <button
                onClick={closeForm}
                style={{ fontSize: 13, padding: '8px 18px', borderRadius: 8, border: '1px solid rgba(245,245,245,0.15)', background: 'transparent', color: 'rgba(245,245,245,0.6)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ fontSize: 13, padding: '8px 20px', borderRadius: 8, border: 'none', background: '#C9A84C', color: '#0D0D0D', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Add service'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: '#0D2B35', border: '1px solid rgba(239,68,68,0.3)' }}>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, color: '#F5F5F5', marginBottom: 12 }}>Delete service?</h3>
            <p style={{ fontSize: 14, color: 'rgba(245,245,245,0.55)', marginBottom: 24 }}>
              This cannot be undone. Any future bookings for this service will need to be manually managed.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)} style={{ fontSize: 13, padding: '7px 16px', borderRadius: 8, border: '1px solid rgba(245,245,245,0.15)', background: 'transparent', color: 'rgba(245,245,245,0.6)', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} disabled={deleting} style={{ fontSize: 13, padding: '7px 16px', borderRadius: 8, border: 'none', background: '#EF4444', color: '#fff', fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1 }}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: '#29C5CC', borderTopColor: 'transparent' }} />
        </div>
      ) : error ? (
        <div className="rounded-xl p-10 text-center" style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
          <p style={{ color: '#F87171' }}>{error}</p>
          <button onClick={loadServices} style={{ marginTop: 12, fontSize: 13, color: '#29C5CC', background: 'transparent', border: '1px solid rgba(41,197,204,0.3)', borderRadius: 8, padding: '6px 16px', cursor: 'pointer' }}>Try again</button>
        </div>
      ) : services.length === 0 ? (
        <div className="rounded-xl p-16 text-center" style={{ border: '1px dashed rgba(245,245,245,0.12)' }}>
          <p style={{ fontSize: 15, color: 'rgba(245,245,245,0.4)', marginBottom: 20 }}>No services added yet</p>
          <button onClick={openAdd} style={{ fontSize: 13, padding: '8px 20px', borderRadius: 8, border: 'none', background: '#C9A84C', color: '#0D0D0D', fontWeight: 600, cursor: 'pointer' }}>
            Add your first service
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {services.map(service => (
            <div
              key={service.id}
              className="flex items-center gap-4 px-5 py-4 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245,245,245,0.07)' }}
            >
              {/* Active toggle */}
              <div
                onClick={() => toggleActive(service)}
                style={{
                  width: 38, height: 22, borderRadius: 11, position: 'relative', cursor: 'pointer', flexShrink: 0,
                  background: service.is_active ? '#29C5CC' : 'rgba(245,245,245,0.15)',
                  transition: 'background 0.2s',
                }}
              >
                <div style={{
                  position: 'absolute', top: 2, left: service.is_active ? 18 : 2,
                  width: 18, height: 18, borderRadius: '50%', background: '#fff',
                  transition: 'left 0.2s',
                }} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span style={{ fontSize: 15, fontWeight: 500, color: '#F5F5F5' }}>{service.name}</span>
                  {service.category && (
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'rgba(41,197,204,0.1)', color: '#29C5CC' }}>
                      {service.category}
                    </span>
                  )}
                  {!service.is_active && (
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'rgba(156,163,175,0.12)', color: '#9CA3AF' }}>
                      Hidden
                    </span>
                  )}
                </div>
                {service.description && (
                  <p style={{ fontSize: 13, color: 'rgba(245,245,245,0.45)', marginTop: 3, marginBottom: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {service.description}
                  </p>
                )}
              </div>

              {/* Price + duration */}
              <div className="text-right flex-shrink-0 hidden sm:block">
                <div style={{ fontSize: 15, fontWeight: 600, color: '#C9A84C' }}>{fmtPrice(service.price)}</div>
                <div style={{ fontSize: 12, color: 'rgba(245,245,245,0.4)', marginTop: 2 }}>{fmtDuration(service.duration_minutes)}</div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => openEdit(service)}
                  style={{ fontSize: 12, padding: '5px 14px', borderRadius: 7, border: '1px solid rgba(245,245,245,0.15)', background: 'transparent', color: 'rgba(245,245,245,0.65)', cursor: 'pointer' }}
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteConfirm(service.id)}
                  style={{ fontSize: 12, padding: '5px 12px', borderRadius: 7, border: '1px solid rgba(239,68,68,0.25)', background: 'transparent', color: '#F87171', cursor: 'pointer' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  fontSize: 14,
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid rgba(245,245,245,0.12)',
  background: 'rgba(255,255,255,0.05)',
  color: '#F5F5F5',
  outline: 'none',
  boxSizing: 'border-box',
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={style}>
      <label style={{ fontSize: 12, color: 'rgba(245,245,245,0.5)', display: 'block', marginBottom: 6, fontWeight: 500 }}>
        {label}
      </label>
      {children}
    </div>
  )
}