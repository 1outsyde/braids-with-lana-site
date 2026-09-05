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
  const { holdId, ...rest } = body

  if (!holdId) {
    return NextResponse.json({ error: 'holdId is required' }, { status: 400 })
  }

  const res = await fetch(`${API_URL}/api/booking/${holdId}/create-payment-intent`, {
    method: 'POST',
    headers: proxyHeaders(req),
    body: JSON.stringify(rest),
  })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
