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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? ''
  const query = status ? `?status=${status}&businessId=${BUSINESS_ID}` : `?businessId=${BUSINESS_ID}`

  const res = await fetch(`${API_URL}/api/business/appointments${query}`, {
    headers: proxyHeaders(req),
    cache: 'no-store',
  })

  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, status, ...rest } = body

  if (!id) return NextResponse.json({ error: 'Appointment ID required' }, { status: 400 })
  if (!status) return NextResponse.json({ error: 'status is required' }, { status: 400 })

  // Route to the correct backend sub-path based on the requested status.
  // PATCH /api/bookings/appointments/:id/complete   — confirmed → completed
  // POST  /api/bookings/appointments/:id/accept     — pending_provider → confirmed (manual-accept flow)
  // POST  /api/bookings/appointments/:id/decline    — pending_provider → declined  (manual-accept flow)
  // Note: PATCH .../status only accepts no_show|late_cancel|rescheduled and is
  // not used by the dashboard UI; route it through for completeness.
  let method: string
  let backendPath: string

  if (status === 'completed') {
    method = 'PATCH'
    backendPath = `${API_URL}/api/bookings/appointments/${id}/complete`
  } else if (status === 'confirmed') {
    method = 'POST'
    backendPath = `${API_URL}/api/bookings/appointments/${id}/accept`
  } else if (status === 'declined') {
    method = 'POST'
    backendPath = `${API_URL}/api/bookings/appointments/${id}/decline`
  } else if (['no_show', 'late_cancel', 'rescheduled'].includes(status)) {
    method = 'PATCH'
    backendPath = `${API_URL}/api/bookings/appointments/${id}/status`
  } else {
    return NextResponse.json({ error: `Unknown status: ${status}` }, { status: 400 })
  }

  const res = await fetch(backendPath, {
    method,
    headers: proxyHeaders(req),
    body: JSON.stringify(status === 'completed' ? {} : { status, ...rest }),
  })

  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}