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
  const { id, ...rest } = body

  if (!id) return NextResponse.json({ error: 'Appointment ID required' }, { status: 400 })

  const res = await fetch(`${API_URL}/api/appointments/${id}`, {
    method: 'PATCH',
    headers: proxyHeaders(req),
    body: JSON.stringify(rest),
  })

  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}