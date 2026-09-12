'use client'

import { useEffect, useState } from 'react'
import {
  SERVICE_LOCATION_TYPES,
  normalizeServiceLocationType,
  vendorLocationLabel,
  type ServiceLocationType,
} from '@/lib/serviceLocation'

interface VendorService {
  id: string
  name: string
  description: string | null
  price: number          // cents
  durationMinutes: number
  category: string | null
  isActive: boolean
  isFeatured: boolean
  status: 'draft' | 'live' | 'archived'
  imageUrl: string | null
  stripeProductId: string | null
  stripePriceId: string | null
  depositAmountCents: number | null
  serviceLocationType?: ServiceLocationType | null
  alternateAddress?: string | null
  alternateCity?: string | null
  alternateState?: string | null
  alternateZipCode?: string | null
  virtualLink?: string | null
  createdAt: string
}

type FormData = {
  name: string
  description: string
  price: string          // dollars (user input)
  durationMinutes: string
  category: string
  isActive: boolean
  depositEnabled: boolean
  depositAmount: string  // dollars (user input)
  serviceLocationType: ServiceLocationType
  alternateAddress: string
  alternateCity: string
  alternateState: string
  alternateZipCode: string
  virtualLink: string
}

const EMPTY_FORM: FormData = {
  name: '', description: '', price: '', durationMinutes: '60', category: '', isActive: true,
  depositEnabled: false, depositAmount: '',
  serviceLocationType: 'business',
  alternateAddress: '', alternateCity: '', alternateState: '', alternateZipCode: '',
  virtualLink: '',
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

const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  live:     { bg: '#29C5CC', color: '#fff', label: 'LIVE'     },
  paused:   { bg: '#C9A84C', color: '#fff', label: 'PAUSED'   },
  draft:    { bg: '#9CA3AF', color: '#fff', label: 'DRAFT'    },
  archived: { bg: '#7F1D1D', color: '#fff', label: 'ARCHIVED' },
}

function getDisplayStatus(s: VendorService) {
  if (s.status === 'archived') return 'archived'
  if (s.status === 'live' && !s.isActive) return 'paused'
  if (s.status === 'live' && s.isActive) return 'live'
  return 'draft'
}

function fmtPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

function fmtDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} hr ${m} min` : `${h} hr${h > 1 ? 's' : ''}`
}

function authHeaders(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export default function ServicesPage() {
  const [services, setServices] = useState<VendorService[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<VendorService | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [publishing, setPublishing] = useState<string | null>(null)
  const [formImageUrl, setFormImageUrl] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [applyingDeposit, setApplyingDeposit] = useState(false)

  async function loadServices() {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('outsyde_access_token')
      const res = await fetch('/api/admin/services', {
        headers: authHeaders(token),
      })
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
    setFormImageUrl(null)
    setShowForm(true)
  }

  function openEdit(service: VendorService) {
    setEditing(service)
    setForm({
      name: service.name,
      description: service.description ?? '',
      price: (service.price / 100).toFixed(2),
      durationMinutes: String(service.durationMinutes),
      category: service.category ?? '',
      isActive: service.isActive,
      depositEnabled: typeof service.depositAmountCents === 'number',
      depositAmount: typeof service.depositAmountCents === 'number'
        ? (service.depositAmountCents / 100).toFixed(2)
        : '',
      serviceLocationType: normalizeServiceLocationType(service.serviceLocationType),
      alternateAddress: service.alternateAddress ?? '',
      alternateCity: service.alternateCity ?? '',
      alternateState: service.alternateState ?? '',
      alternateZipCode: service.alternateZipCode ?? '',
      virtualLink: service.virtualLink ?? '',
    })
    setFormError(null)
    setFormImageUrl(service.imageUrl ?? null)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setFormImageUrl(null)
    setApplyingDeposit(false)
  }

  async function handleImageUpload(file: File) {
    setUploadingImage(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const token = localStorage.getItem('outsyde_access_token')
      const res = await fetch('/api/admin/services/upload-image', {
        method: 'POST',
        headers: authHeaders(token),
        body: fd,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Upload failed')
      setFormImageUrl((data as { url?: string }).url ?? null)
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Image upload failed.')
    } finally {
      setUploadingImage(false)
    }
  }

  async function handleSave() {
    setFormError(null)
    if (!form.name.trim()) { setFormError('Service name is required.'); return }
    const price = parseFloat(form.price)
    if (isNaN(price) || price < 0) { setFormError('Enter a valid price.'); return }
    const duration = parseInt(form.durationMinutes)
    if (!duration || duration < 15) { setFormError('Duration must be at least 15 minutes.'); return }

    let depositAmountCents: number | null = null
    if (form.depositEnabled) {
      const depositVal = parseFloat(form.depositAmount)
      if (isNaN(depositVal) || depositVal < 0) { setFormError('Enter a valid deposit amount.'); return }
      depositAmountCents = Math.round(depositVal * 100)
    }

    if (form.serviceLocationType === 'alternate') {
      if (!form.alternateAddress.trim() || !form.alternateCity.trim() || !form.alternateState.trim()) {
        setFormError('Enter the alternate street address, city, and state.')
        return
      }
    }
    if (form.serviceLocationType === 'virtual' && !form.virtualLink.trim()) {
      setFormError('Enter a meeting link for virtual services.')
      return
    }

    setSaving(true)
    try {
      const token = localStorage.getItem('outsyde_access_token')
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: Math.round(price * 100),
        durationMinutes: duration,
        category: form.category.trim() || null,
        isActive: form.isActive,
        imageUrl: formImageUrl,
        depositAmountCents,
        serviceLocationType: form.serviceLocationType,
        alternateAddress: form.serviceLocationType === 'alternate' ? form.alternateAddress.trim() : null,
        alternateCity: form.serviceLocationType === 'alternate' ? form.alternateCity.trim() : null,
        alternateState: form.serviceLocationType === 'alternate' ? form.alternateState.trim() : null,
        alternateZipCode: form.serviceLocationType === 'alternate' ? (form.alternateZipCode.trim() || null) : null,
        virtualLink: form.serviceLocationType === 'virtual' ? form.virtualLink.trim() : null,
      }

      const res = editing
        ? await fetch(`/api/admin/services/${editing.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/admin/services', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
            body: JSON.stringify(payload),
          })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { message?: string }).message ?? 'Save failed')
      }

      closeForm()
      await loadServices()
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Could not save service.')
    } finally {
      setSaving(false)
    }
  }

  async function handlePublish(service: VendorService) {
    setPublishing(service.id)
    try {
      const token = localStorage.getItem('outsyde_access_token')
      const isFirstPublish = !service.stripeProductId

      if (isFirstPublish) {
        const res = await fetch(`/api/admin/services/${service.id}/go-live`, {
          method: 'POST',
          headers: authHeaders(token),
        })
        if (!res.ok) throw new Error('Publish failed')
      } else {
        const res = await fetch(`/api/admin/services/${service.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
          body: JSON.stringify({ status: 'live', isActive: true }),
        })
        if (!res.ok) throw new Error('Publish failed')
      }

      await loadServices()
    } catch {
      alert('Could not publish service. Please try again.')
    } finally {
      setPublishing(null)
    }
  }

  async function handleArchive(service: VendorService) {
    const token = localStorage.getItem('outsyde_access_token')
    try {
      await fetch(`/api/admin/services/${service.id}/archive`, {
        method: 'POST',
        headers: authHeaders(token),
      })
      await loadServices()
    } catch {
      alert('Could not archive service.')
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      const token = localStorage.getItem('outsyde_access_token')
      const res = await fetch(`/api/admin/services/${id}`, {
        method: 'DELETE',
        headers: authHeaders(token),
      })
      if (!res.ok) throw new Error()
      setDeleteConfirm(null)
      await loadServices()
    } catch {
      alert('Could not delete service. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  async function toggleActive(service: VendorService) {
    try {
      const token = localStorage.getItem('outsyde_access_token')
      await fetch(`/api/admin/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
        body: JSON.stringify({ isActive: !service.isActive }),
      })
      await loadServices()
    } catch {
      alert('Could not update service.')
    }
  }

  async function handleApplyDepositToAll() {
    let depositAmountCents: number | null = null
    if (form.depositEnabled) {
      const depositVal = parseFloat(form.depositAmount)
      if (isNaN(depositVal) || depositVal < 0) { setFormError('Enter a valid deposit amount before applying to all.'); return }
      depositAmountCents = Math.round(depositVal * 100)
    }
    setApplyingDeposit(true)
    try {
      const token = localStorage.getItem('outsyde_access_token')
      const res = await fetch('/api/admin/services/apply-deposit-to-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
        body: JSON.stringify({ depositAmountCents }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error ?? 'Failed to apply deposit')
      }
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Could not apply deposit to all services.')
    } finally {
      setApplyingDeposit(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 38, fontWeight: 600, color: '#0D2B35', margin: 0, lineHeight: 1 }}>
            Services
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)', marginTop: 6 }}>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-lg rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, fontWeight: 600, color: '#0D2B35', marginBottom: 24 }}>
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
                    value={form.durationMinutes}
                    onChange={e => setForm(f => ({ ...f, durationMinutes: e.target.value }))}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    {DURATION_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
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

              <Field label="Where does this service take place?">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {SERVICE_LOCATION_TYPES.map(value => {
                    const selected = form.serviceLocationType === value
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setForm(f => ({
                          ...f,
                          serviceLocationType: value,
                          alternateAddress: '',
                          alternateCity: '',
                          alternateState: '',
                          alternateZipCode: '',
                          virtualLink: '',
                        }))}
                        style={{
                          padding: '7px 12px',
                          borderRadius: 8,
                          border: `1.5px solid ${selected ? '#C9A84C' : 'rgba(0,0,0,0.12)'}`,
                          background: selected ? 'rgba(201,168,76,0.14)' : '#F5F7F8',
                          color: selected ? '#92740A' : 'rgba(0,0,0,0.55)',
                          fontSize: 13,
                          fontWeight: selected ? 600 : 400,
                          cursor: 'pointer',
                        }}
                      >
                        {vendorLocationLabel(value)}
                      </button>
                    )
                  })}
                </div>
              </Field>

              {form.serviceLocationType === 'alternate' && (
                <>
                  <Field label="Address *">
                    <input
                      value={form.alternateAddress}
                      onChange={e => setForm(f => ({ ...f, alternateAddress: e.target.value }))}
                      placeholder="123 Main Street"
                      style={inputStyle}
                    />
                  </Field>
                  <div className="flex gap-4">
                    <Field label="City *" style={{ flex: 1 }}>
                      <input
                        value={form.alternateCity}
                        onChange={e => setForm(f => ({ ...f, alternateCity: e.target.value }))}
                        placeholder="City"
                        style={inputStyle}
                      />
                    </Field>
                    <Field label="State *" style={{ flex: 1 }}>
                      <input
                        value={form.alternateState}
                        onChange={e => setForm(f => ({ ...f, alternateState: e.target.value }))}
                        placeholder="VA"
                        style={inputStyle}
                      />
                    </Field>
                  </div>
                  <Field label="ZIP Code">
                    <input
                      value={form.alternateZipCode}
                      onChange={e => setForm(f => ({ ...f, alternateZipCode: e.target.value }))}
                      placeholder="23451"
                      style={inputStyle}
                    />
                  </Field>
                </>
              )}

              {form.serviceLocationType === 'virtual' && (
                <Field label="Meeting Room Link *">
                  <input
                    value={form.virtualLink}
                    onChange={e => setForm(f => ({ ...f, virtualLink: e.target.value }))}
                    placeholder="https://zoom.us/j/..."
                    style={inputStyle}
                  />
                </Field>
              )}

              <Field label="Service Photo (optional)">
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingImage}
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file)
                    e.target.value = ''
                  }}
                  style={{ ...inputStyle, padding: '7px 12px', cursor: 'pointer' }}
                />
                {uploadingImage && (
                  <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginTop: 6 }}>Uploading…</p>
                )}
                {formImageUrl && !uploadingImage && (
                  <div style={{ marginTop: 8, position: 'relative', display: 'inline-block' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formImageUrl}
                      alt="Service preview"
                      style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 6, display: 'block', border: '1px solid rgba(0,0,0,0.1)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setFormImageUrl(null)}
                      style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', border: 'none', background: '#EF4444', color: '#fff', fontSize: 12, lineHeight: '20px', textAlign: 'center', cursor: 'pointer', padding: 0 }}
                    >
                      ×
                    </button>
                  </div>
                )}
              </Field>

              <label className="flex items-center gap-3 cursor-pointer" style={{ fontSize: 14, color: 'rgba(0,0,0,0.6)' }}>
                <div
                  onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                  style={{
                    width: 42, height: 24, borderRadius: 12, position: 'relative', cursor: 'pointer',
                    background: form.isActive ? '#C9A84C' : 'rgba(0,0,0,0.15)',
                    transition: 'background 0.2s',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 3, left: form.isActive ? 21 : 3,
                    width: 18, height: 18, borderRadius: '50%', background: '#fff',
                    transition: 'left 0.2s',
                  }} />
                </div>
                Active (visible to clients when live)
              </label>

              {/* Deposit section */}
              <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: 16 }}>
                <label className="flex items-center gap-3 cursor-pointer" style={{ fontSize: 14, color: 'rgba(0,0,0,0.6)', marginBottom: form.depositEnabled ? 12 : 0 }}>
                  <div
                    onClick={() => setForm(f => ({ ...f, depositEnabled: !f.depositEnabled, depositAmount: f.depositEnabled ? '' : f.depositAmount }))}
                    style={{
                      width: 42, height: 24, borderRadius: 12, position: 'relative', cursor: 'pointer',
                      background: form.depositEnabled ? '#C9A84C' : 'rgba(0,0,0,0.15)',
                      transition: 'background 0.2s',
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: 3, left: form.depositEnabled ? 21 : 3,
                      width: 18, height: 18, borderRadius: '50%', background: '#fff',
                      transition: 'left 0.2s',
                    }} />
                  </div>
                  Require deposit at booking
                </label>
                {form.depositEnabled && (
                  <div className="flex gap-3 items-end">
                    <Field label="Deposit amount ($)" style={{ flex: 1 }}>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.depositAmount}
                        onChange={e => setForm(f => ({ ...f, depositAmount: e.target.value }))}
                        placeholder="0.00"
                        style={inputStyle}
                      />
                    </Field>
                    <button
                      type="button"
                      onClick={handleApplyDepositToAll}
                      disabled={applyingDeposit}
                      title="Apply this deposit amount to all services"
                      style={{ fontSize: 12, padding: '9px 14px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', background: 'transparent', color: 'rgba(0,0,0,0.55)', cursor: applyingDeposit ? 'not-allowed' : 'pointer', opacity: applyingDeposit ? 0.6 : 1, whiteSpace: 'nowrap', marginBottom: 0 }}
                    >
                      {applyingDeposit ? 'Applying…' : 'Apply to all'}
                    </button>
                  </div>
                )}
              </div>

              {formError && (
                <p style={{ fontSize: 13, color: '#991B1B', margin: 0 }}>{formError}</p>
              )}
            </div>

            <div className="flex gap-3 mt-6 justify-end">
              <button
                onClick={closeForm}
                style={{ fontSize: 13, padding: '8px 18px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', background: 'transparent', color: 'rgba(0,0,0,0.55)', cursor: 'pointer' }}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid rgba(239,68,68,0.2)', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, color: '#0D2B35', marginBottom: 12 }}>Delete service?</h3>
            <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.5)', marginBottom: 24 }}>
              This cannot be undone. Any future bookings for this service will need to be manually managed.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)} style={{ fontSize: 13, padding: '7px 16px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', background: 'transparent', color: 'rgba(0,0,0,0.55)', cursor: 'pointer' }}>
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
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', padding: '20px 24px' }}>
              <div style={{ height: 16, width: 180, borderRadius: 4, background: 'rgba(0,0,0,0.06)', marginBottom: 8 }} />
              <div style={{ height: 12, width: 280, borderRadius: 4, background: 'rgba(0,0,0,0.04)' }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl text-center" style={{ background: '#FFFFFF', border: '1px solid rgba(239,68,68,0.15)', padding: '48px 24px' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 22 }}>
            ⚠
          </div>
          <p style={{ color: '#991B1B', fontSize: 14, marginBottom: 16 }}>{error}</p>
          <button onClick={loadServices} style={{ fontSize: 13, padding: '7px 18px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', background: 'transparent', color: 'rgba(0,0,0,0.55)', cursor: 'pointer' }}>Try again</button>
        </div>
      ) : services.length === 0 ? (
        <div className="rounded-2xl text-center" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', padding: '56px 24px' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 24 }}>
            ✂
          </div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 600, color: '#0D2B35', marginBottom: 8 }}>
            No services added yet
          </div>
          <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.4)', marginBottom: 24 }}>Add your services so clients can book online</p>
          <button onClick={openAdd} style={{ fontSize: 13, padding: '8px 20px', borderRadius: 8, border: 'none', background: '#C9A84C', color: '#0D0D0D', fontWeight: 600, cursor: 'pointer' }}>
            Add your first service
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {services.map(service => {
            const displayStatus = getDisplayStatus(service)
            const badge = STATUS_BADGE[displayStatus]
            const isPublishing = publishing === service.id

            return (
              <div
                key={service.id}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl"
                style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)' }}
              >
                {/* Active toggle — only for live services */}
                {service.status === 'live' && (
                  <div
                    onClick={() => toggleActive(service)}
                    title={service.isActive ? 'Click to pause (hide from homepage)' : 'Click to make visible'}
                    style={{
                      width: 38, height: 22, borderRadius: 11, position: 'relative', cursor: 'pointer', flexShrink: 0,
                      background: service.isActive ? '#C9A84C' : 'rgba(0,0,0,0.15)',
                      transition: 'background 0.2s',
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: 2, left: service.isActive ? 18 : 2,
                      width: 18, height: 18, borderRadius: '50%', background: '#fff',
                      transition: 'left 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                    }} />
                  </div>
                )}
                {service.status !== 'live' && (
                  <div style={{ width: 38, flexShrink: 0 }} />
                )}

                {/* Status badge */}
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                  padding: '3px 8px', borderRadius: 4,
                  background: badge.bg, color: badge.color,
                  flexShrink: 0,
                }}>
                  {badge.label}
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span style={{ fontSize: 15, fontWeight: 500, color: '#0D2B35' }}>{service.name}</span>
                    {service.category && (
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'rgba(13,43,53,0.07)', color: '#0D2B35' }}>
                        {service.category}
                      </span>
                    )}
                    {typeof service.depositAmountCents === 'number' && (
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'rgba(201,168,76,0.12)', color: '#92740A' }}>
                        {fmtPrice(service.depositAmountCents)} deposit
                      </span>
                    )}
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'rgba(41,197,204,0.12)', color: '#0D2B35' }}>
                      {vendorLocationLabel(service.serviceLocationType)}
                    </span>
                  </div>
                  {service.description && (
                    <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', marginTop: 3, marginBottom: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {service.description}
                    </p>
                  )}
                </div>

                {/* Price + duration */}
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#C9A84C' }}>{fmtPrice(service.price)}</div>
                  <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', marginTop: 2 }}>{fmtDuration(service.durationMinutes)}</div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0" style={{ flexWrap: 'wrap' }}>
                  {displayStatus === 'draft' && (
                    <button
                      onClick={() => handlePublish(service)}
                      disabled={isPublishing}
                      style={{ fontSize: 12, padding: '5px 14px', borderRadius: 7, border: 'none', background: '#29C5CC', color: '#fff', fontWeight: 600, cursor: isPublishing ? 'not-allowed' : 'pointer', opacity: isPublishing ? 0.7 : 1 }}
                    >
                      {isPublishing ? 'Publishing…' : 'Publish'}
                    </button>
                  )}
                  {displayStatus === 'paused' && (
                    <button
                      onClick={() => handlePublish(service)}
                      disabled={isPublishing}
                      style={{ fontSize: 12, padding: '5px 14px', borderRadius: 7, border: 'none', background: '#29C5CC', color: '#fff', fontWeight: 600, cursor: isPublishing ? 'not-allowed' : 'pointer', opacity: isPublishing ? 0.7 : 1 }}
                    >
                      {isPublishing ? 'Activating…' : 'Re-activate'}
                    </button>
                  )}
                  {displayStatus === 'live' && (
                    <button
                      onClick={() => handleArchive(service)}
                      style={{ fontSize: 12, padding: '5px 14px', borderRadius: 7, border: '1px solid rgba(0,0,0,0.12)', background: 'transparent', color: 'rgba(0,0,0,0.45)', cursor: 'pointer' }}
                    >
                      Archive
                    </button>
                  )}
                  <button
                    onClick={() => openEdit(service)}
                    style={{ fontSize: 12, padding: '5px 14px', borderRadius: 7, border: '1px solid rgba(0,0,0,0.12)', background: 'transparent', color: 'rgba(0,0,0,0.55)', cursor: 'pointer' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(service.id)}
                    style={{ fontSize: 12, padding: '5px 12px', borderRadius: 7, border: '1px solid rgba(239,68,68,0.25)', background: 'transparent', color: '#991B1B', cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  fontSize: 16,
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid rgba(0,0,0,0.12)',
  background: '#F5F7F8',
  color: '#1A1A1A',
  outline: 'none',
  boxSizing: 'border-box',
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={style}>
      <label style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)', display: 'block', marginBottom: 6, fontWeight: 500 }}>
        {label}
      </label>
      {children}
    </div>
  )
}
