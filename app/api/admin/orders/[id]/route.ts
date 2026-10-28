import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.OUTSYDE_API_URL!
const BUSINESS_ID = process.env.OUTSYDE_BUSINESS_ID!

function proxyHeaders(req: NextRequest): Record<string, string> {
  const token = req.cookies.get('outsyde_access_token')?.value
  const cookieHeader = req.headers.get('cookie')
  return {
    'Content-Type': 'application/json',
    'x-business-id': BUSINESS_ID ?? '',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(cookieHeader ? { Cookie: cookieHeader } : {}),
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  // Only the fields the dashboard changes: mark shipped (with tracking) or cancel.
  const body = await req.json().catch(() => ({})) as { status?: unknown; trackingNumber?: unknown; carrier?: unknown }
  const status = body.status === 'shipped' || body.status === 'cancelled' ? body.status : null
  if (!status) return NextResponse.json({ error: 'Unsupported change.' }, { status: 400 })
  const trackingNumber = typeof body.trackingNumber === 'string' ? body.trackingNumber.trim().slice(0, 100) : ''
  const carrier = typeof body.carrier === 'string' ? body.carrier.trim().slice(0, 40) : ''

  const res = await fetch(`${API_URL}/api/business/orders/${id}`, {
    method: 'PATCH',
    headers: proxyHeaders(req),
    body: JSON.stringify({ status, ...(status === 'shipped' ? { trackingNumber, carrier } : {}) }),
  })

  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}