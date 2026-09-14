'use client'

import { useEffect, useState } from 'react'

interface Product {
  id: string
  name: string
  description?: string
  price: number          // cents
  status: 'draft' | 'live' | 'archived' | 'paused'
  is_active: boolean
  stripe_product_id?: string
  image_url?: string
  inventory?: number
  category?: string
}

type ProductStatus = 'live' | 'paused' | 'draft' | 'archived'

const STATUS_BADGE: Record<ProductStatus, { bg: string; color: string; label: string }> = {
  live:     { bg: '#D1FAE5', color: '#065F46', label: 'LIVE'     },
  paused:   { bg: '#FEF3C7', color: '#92400E', label: 'PAUSED'   },
  draft:    { bg: '#F3F4F6', color: '#6B7280', label: 'DRAFT'    },
  archived: { bg: '#FEE2E2', color: '#991B1B', label: 'ARCHIVED' },
}

function getDisplayStatus(p: Product): ProductStatus {
  if (p.status === 'live' && p.is_active) return 'live'
  if (p.status === 'live' && !p.is_active) return 'paused'
  if (p.status === 'archived') return 'archived'
  return 'draft'
}

function fmtPrice(cents: number) { return `$${(cents / 100).toFixed(2)}` }

type FormData = { name: string; description: string; price: string; category: string; inventory: string }
const EMPTY_FORM: FormData = { name: '', description: '', price: '', category: '', inventory: '' }

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [publishLoading, setPublishLoading] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  async function loadProducts() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/products')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setProducts(Array.isArray(data) ? data : (data.products ?? []))
    } catch {
      setError('Could not load products.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadProducts() }, [])

  function openAdd() {
    setEditing(null); setForm(EMPTY_FORM); setFormError(null); setShowForm(true)
  }
  function openEdit(p: Product) {
    setEditing(p)
    setForm({ name: p.name, description: p.description ?? '', price: (p.price / 100).toFixed(2), category: p.category ?? '', inventory: p.inventory != null ? String(p.inventory) : '' })
    setFormError(null); setShowForm(true)
  }
  function closeForm() { setShowForm(false); setEditing(null); setForm(EMPTY_FORM); setFormError(null) }

  async function handleSave() {
    setFormError(null)
    if (!form.name.trim()) { setFormError('Product name is required.'); return }
    const price = parseFloat(form.price)
    if (isNaN(price) || price < 0) { setFormError('Enter a valid price.'); return }

    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price: Math.round(price * 100),
        category: form.category.trim() || undefined,
        inventory: form.inventory ? parseInt(form.inventory) : undefined,
      }

      const res = editing
        ? await fetch(`/api/admin/products/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        : await fetch('/api/admin/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message ?? 'Save failed')
      }
      closeForm(); await loadProducts()
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Could not save product.')
    } finally {
      setSaving(false)
    }
  }

  async function handlePublish(product: Product) {
    const isFirstPublish = !product.stripe_product_id
    const displayStatus = getDisplayStatus(product)
    const goingLive = displayStatus !== 'live'

    setPublishLoading(product.id)
    try {
      let res: Response
      if (isFirstPublish && goingLive) {
        res = await fetch(`/api/admin/products/${product.id}/go-live`, { method: 'POST' })
      } else {
        res = await fetch(`/api/admin/products/${product.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(goingLive ? { status: 'live', isActive: true } : { status: 'draft', isActive: false }),
        })
      }
      if (!res.ok) throw new Error()
      await loadProducts()
    } catch {
      alert('Could not update product status.')
    } finally {
      setPublishLoading(null)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setDeleteConfirm(null); await loadProducts()
    } catch {
      alert('Could not delete product.')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 38, fontWeight: 600, color: '#1C1008', margin: 0, lineHeight: 1 }}>Products</h1>
          <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)', marginTop: 6 }}>{products.length} product{products.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openAdd} style={{ fontSize: 13, padding: '8px 18px', borderRadius: 8, border: 'none', background: '#F5C518', color: '#0D0D0D', fontWeight: 600, cursor: 'pointer' }}>
          + Add Product
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-lg rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, fontWeight: 600, color: '#1C1008', marginBottom: 24 }}>
              {editing ? 'Edit Product' : 'Add Product'}
            </h2>
            <div className="flex flex-col gap-4">
              <div>
                <label style={labelStyle}>Product name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Braid Spray" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div className="flex gap-4">
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Price ($) *</label>
                  <input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Inventory (optional)</label>
                  <input type="number" min="0" value={form.inventory} onChange={e => setForm(f => ({ ...f, inventory: e.target.value }))} placeholder="Unlimited" style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Category</label>
                <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Hair Care" style={inputStyle} />
              </div>
              {formError && <p style={{ fontSize: 13, color: '#991B1B', margin: 0 }}>{formError}</p>}
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button onClick={closeForm} style={{ fontSize: 13, padding: '8px 18px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', background: 'transparent', color: 'rgba(0,0,0,0.55)', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ fontSize: 13, padding: '8px 20px', borderRadius: 8, border: 'none', background: '#F5C518', color: '#0D0D0D', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Add product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid rgba(239,68,68,0.2)', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, color: '#1C1008', marginBottom: 12 }}>Delete product?</h3>
            <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.5)', marginBottom: 24 }}>This is permanent and cannot be undone. The product will be removed from your storefront immediately.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)} style={{ fontSize: 13, padding: '7px 16px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', background: 'transparent', color: 'rgba(0,0,0,0.55)', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ fontSize: 13, padding: '7px 16px', borderRadius: 8, border: 'none', background: '#EF4444', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', padding: '20px 24px' }}>
              <div style={{ height: 16, width: 180, borderRadius: 4, background: 'rgba(0,0,0,0.06)', marginBottom: 8 }} />
              <div style={{ height: 12, width: 120, borderRadius: 4, background: 'rgba(0,0,0,0.04)' }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl text-center" style={{ background: '#FFFFFF', border: '1px solid rgba(239,68,68,0.15)', padding: '48px 24px' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 22 }}>
            ⚠
          </div>
          <p style={{ color: '#991B1B', fontSize: 14, marginBottom: 16 }}>{error}</p>
          <button onClick={loadProducts} style={{ fontSize: 13, padding: '7px 18px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', background: 'transparent', color: 'rgba(0,0,0,0.55)', cursor: 'pointer' }}>Try again</button>
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl text-center" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', padding: '56px 24px' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(245,197,24,0.1)', border: '1px solid rgba(245,197,24,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 24 }}>
            🏷
          </div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 600, color: '#1C1008', marginBottom: 8 }}>No products yet</div>
          <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.4)', marginBottom: 24 }}>Add products to sell through your storefront</p>
          <button onClick={openAdd} style={{ fontSize: 13, padding: '8px 20px', borderRadius: 8, border: 'none', background: '#F5C518', color: '#0D0D0D', fontWeight: 600, cursor: 'pointer' }}>Add your first product</button>
        </div>
      ) : (
        <div className="grid gap-3">
          {products.map(product => {
            const displayStatus = getDisplayStatus(product)
            const badge = STATUS_BADGE[displayStatus]
            const isLive = displayStatus === 'live'
            return (
              <div key={product.id} className="flex items-center gap-4 px-5 py-4 rounded-2xl" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)' }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span style={{ fontSize: 15, fontWeight: 500, color: '#1C1008' }}>{product.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 10, background: badge.bg, color: badge.color }}>
                      {badge.label}
                    </span>
                  </div>
                  {product.category && <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', marginTop: 3, display: 'block' }}>{product.category}</span>}
                </div>
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#F5C518' }}>{fmtPrice(product.price)}</div>
                  {product.inventory != null && <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', marginTop: 2 }}>Stock: {product.inventory}</div>}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handlePublish(product)}
                    disabled={publishLoading === product.id}
                    style={{ fontSize: 12, padding: '5px 14px', borderRadius: 7, border: '1px solid', borderColor: isLive ? 'rgba(0,0,0,0.12)' : 'rgba(245,197,24,0.5)', background: isLive ? 'transparent' : 'rgba(245,197,24,0.08)', color: isLive ? 'rgba(0,0,0,0.45)' : '#F5C518', cursor: 'pointer', opacity: publishLoading === product.id ? 0.6 : 1 }}
                  >
                    {publishLoading === product.id ? '…' : isLive ? 'Unpublish' : 'Publish'}
                  </button>
                  <button onClick={() => openEdit(product)} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 7, border: '1px solid rgba(0,0,0,0.12)', background: 'transparent', color: 'rgba(0,0,0,0.55)', cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => setDeleteConfirm(product.id)} style={{ fontSize: 12, padding: '5px 10px', borderRadius: 7, border: '1px solid rgba(239,68,68,0.25)', background: 'transparent', color: '#991B1B', cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = { width: '100%', fontSize: 14, padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', background: '#F5F7F8', color: '#1A1A1A', outline: 'none', boxSizing: 'border-box' }
const labelStyle: React.CSSProperties = { fontSize: 12, color: 'rgba(0,0,0,0.5)', display: 'block', marginBottom: 6, fontWeight: 500 }
