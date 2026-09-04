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
  const res = await fetch(`${API_URL}/api/vendor/products?businessId=${BUSINESS_ID}&includeInactive=true`, {
    headers: proxyHeaders(req),
    cache: 'no-store',
  })

  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  const res = await fetch(`${API_URL}/api/vendor/products`, {
    method: 'POST',
    headers: proxyHeaders(req),
    body: JSON.stringify({ ...body, businessId: BUSINESS_ID }),
  })

  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}