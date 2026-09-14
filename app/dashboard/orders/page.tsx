'use client'

import { useEffect, useState } from 'react'

interface OrderItem {
  name: string
  quantity: number
  price: number
  variant_label?: string
}

interface Order {
  id: string
  order_number: number
  status: string
  customer_name: string
  customer_email: string
  items: OrderItem[]
  total_amount: number
  tracking_number?: string
  carrier?: string
  created_at: string
}

type ShipForm = { trackingNumber: string; carrier: string }

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending:   { bg: '#F3F4F6', color: '#6B7280' },
  paid:      { bg: '#FEF3C7', color: '#92400E' },
  shipped:   { bg: '#DBEAFE', color: '#1E40AF' },
  delivered: { bg: '#D1FAE5', color: '#065F46' },
  cancelled: { bg: '#FEE2E2', color: '#991B1B' },
}

function fmtOrderNum(n: number) { return `#${String(n).padStart(4, '0')}` }
function fmtMoney(cents: number) { return `$${(cents / 100).toFixed(2)}` }
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [shipModal, setShipModal] = useState<Order | null>(null)
  const [shipForm, setShipForm] = useState<ShipForm>({ trackingNumber: '', carrier: '' })
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  async function loadOrders() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/orders')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setOrders(Array.isArray(data) ? data : (data.orders ?? []))
    } catch {
      setError('Could not load orders.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadOrders() }, [])

  async function handleShip(order: Order) {
    if (!shipForm.trackingNumber.trim()) { alert('Tracking number required.'); return }
    setActionLoading(order.id + 'ship')
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingNumber: shipForm.trackingNumber, carrier: shipForm.carrier }),
      })
      if (!res.ok) throw new Error()
      setShipModal(null)
      setShipForm({ trackingNumber: '', carrier: '' })
      await loadOrders()
    } catch {
      alert('Could not ship order. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleCancel(id: string) {
    if (!confirm('Cancel this order?')) return
    setActionLoading(id + 'cancel')
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })
      if (!res.ok) throw new Error()
      await loadOrders()
    } catch {
      alert('Could not cancel order.')
    } finally {
      setActionLoading(null)
    }
  }

  const pendingOrders = orders.filter(o => o.status === 'paid')

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 38, fontWeight: 600, color: '#1C1008', margin: 0, lineHeight: 1 }}>Orders</h1>
          <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)', marginTop: 6 }}>
            {pendingOrders.length > 0 ? `${pendingOrders.length} awaiting fulfillment` : 'All orders fulfilled'}
          </p>
        </div>
        <button onClick={loadOrders} style={{ fontSize: 13, color: 'rgba(0,0,0,0.5)', background: 'transparent', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>
          Refresh
        </button>
      </div>

      {/* Ship modal */}
      {shipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 600, color: '#1C1008', marginBottom: 6 }}>
              Ship {fmtOrderNum(shipModal.order_number)}
            </h3>
            <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', marginBottom: 24 }}>
              Enter tracking information to mark this order as shipped.
            </p>
            <div className="flex flex-col gap-4">
              <div>
                <label style={labelStyle}>Tracking number *</label>
                <input
                  value={shipForm.trackingNumber}
                  onChange={e => setShipForm(f => ({ ...f, trackingNumber: e.target.value }))}
                  placeholder="1Z999AA10123456784"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Carrier</label>
                <select
                  value={shipForm.carrier}
                  onChange={e => setShipForm(f => ({ ...f, carrier: e.target.value }))}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="">Select carrier</option>
                  <option value="UPS">UPS</option>
                  <option value="USPS">USPS</option>
                  <option value="FedEx">FedEx</option>
                  <option value="DHL">DHL</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShipModal(null)} style={{ fontSize: 13, padding: '7px 16px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', background: 'transparent', color: 'rgba(0,0,0,0.55)', cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={() => handleShip(shipModal)}
                disabled={!!actionLoading}
                style={{ fontSize: 13, padding: '7px 20px', borderRadius: 8, border: 'none', background: '#F5C518', color: '#0D0D0D', fontWeight: 600, cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.7 : 1 }}
              >
                {actionLoading ? 'Shipping…' : 'Mark shipped'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', padding: '20px 24px' }}>
              <div style={{ height: 14, width: 120, borderRadius: 4, background: 'rgba(0,0,0,0.06)', marginBottom: 8 }} />
              <div style={{ height: 12, width: 200, borderRadius: 4, background: 'rgba(0,0,0,0.04)' }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl text-center" style={{ background: '#FFFFFF', border: '1px solid rgba(239,68,68,0.15)', padding: '48px 24px' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 22 }}>
            ⚠
          </div>
          <p style={{ color: '#991B1B', fontSize: 14, marginBottom: 16 }}>{error}</p>
          <button onClick={loadOrders} style={{ fontSize: 13, padding: '7px 18px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', background: 'transparent', color: 'rgba(0,0,0,0.55)', cursor: 'pointer' }}>Try again</button>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl text-center" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', padding: '56px 24px' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(245,197,24,0.1)', border: '1px solid rgba(245,197,24,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 24 }}>
            📦
          </div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 600, color: '#1C1008', marginBottom: 8 }}>No orders yet</div>
          <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.4)', margin: 0 }}>Orders will appear here once customers purchase</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map(order => {
            const st = STATUS_STYLE[order.status] ?? STATUS_STYLE.pending
            const isOpen = expanded === order.id
            return (
              <div key={order.id} className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)' }}>
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer"
                  onClick={() => setExpanded(isOpen ? null : order.id)}
                >
                  <span style={{ fontSize: 13, color: '#F5C518', fontFamily: 'DM Mono, monospace', flexShrink: 0, fontWeight: 500 }}>
                    {fmtOrderNum(order.order_number)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 14, color: '#1C1008', fontWeight: 500 }}>{order.customer_name}</div>
                    <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', marginTop: 2 }}>{fmtDate(order.created_at)}</div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#F5C518', flexShrink: 0 }}>{fmtMoney(order.total_amount)}</div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 10, background: st.bg, color: st.color, flexShrink: 0 }}>
                    {order.status.toUpperCase()}
                  </span>
                  <svg width="16" height="16" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" />
                  </svg>
                </div>

                {isOpen && (
                  <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', padding: '16px 20px', background: '#FAFAFA' }}>
                    <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', marginBottom: 12 }}>{order.customer_email}</div>
                    <div className="flex flex-col gap-2 mb-4">
                      {(order.items ?? []).map((item, i) => (
                        <div key={i} className="flex justify-between" style={{ fontSize: 13 }}>
                          <span style={{ color: 'rgba(0,0,0,0.65)' }}>
                            {item.name}{item.variant_label ? ` — ${item.variant_label}` : ''} × {item.quantity}
                          </span>
                          <span style={{ color: 'rgba(0,0,0,0.45)' }}>{fmtMoney(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    {order.tracking_number && (
                      <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 12 }}>
                        Tracking: <span style={{ color: '#1E40AF', fontWeight: 500 }}>{order.tracking_number}</span>
                        {order.carrier ? ` via ${order.carrier}` : ''}
                      </div>
                    )}
                    <div className="flex gap-2">
                      {order.status === 'paid' && (
                        <button
                          onClick={() => { setShipModal(order); setShipForm({ trackingNumber: '', carrier: '' }) }}
                          style={{ fontSize: 13, padding: '6px 16px', borderRadius: 8, border: 'none', background: '#F5C518', color: '#0D0D0D', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Ship order
                        </button>
                      )}
                      {(order.status === 'paid' || order.status === 'pending') && (
                        <button
                          onClick={() => handleCancel(order.id)}
                          disabled={!!actionLoading}
                          style={{ fontSize: 13, padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#991B1B', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', fontSize: 14, padding: '9px 12px', borderRadius: 8,
  border: '1px solid rgba(0,0,0,0.12)', background: '#F5F7F8',
  color: '#1A1A1A', outline: 'none', boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: 12, color: 'rgba(0,0,0,0.5)', display: 'block', marginBottom: 6, fontWeight: 500,
}
