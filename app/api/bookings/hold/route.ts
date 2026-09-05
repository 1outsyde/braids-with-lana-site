import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.OUTSYDE_API_URL!
const BUSINESS_ID = process.env.OUTSYDE_BUSINESS_ID!

function proxyHeaders(req: NextRequest): Record<string, string> {
  const token = req.cookies.get('outsyde_access_token')?.value
  return {
    'Content-Type': 'application/json',
    'x-business-id': BUSINESS_ID,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const payload = {
    ...body,
    providerType: 'business',
    providerId: BUSINESS_ID,
  }
  const res = await fetch(`${API_URL}/api/booking/hold`, {
    method: 'POST',
    headers: proxyHeaders(req),
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
