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

// Saves the dashboard browser's IANA time zone on this site's business.
// The backend only fills it when the business has no time zone yet
// (overwrite: false), and only for the business owner or a platform admin.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const timeZone = typeof body?.timeZone === 'string' ? body.timeZone.trim() : ''

  if (!timeZone) return NextResponse.json({ error: 'timeZone is required' }, { status: 400 })
  if (!BUSINESS_ID) return NextResponse.json({ error: 'Business is not configured' }, { status: 500 })

  const res = await fetch(`${API_URL}/api/me/time-zone`, {
    method: 'POST',
    headers: proxyHeaders(req),
    body: JSON.stringify({ timeZone, businessId: BUSINESS_ID, overwrite: false }),
    cache: 'no-store',
  })

  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
