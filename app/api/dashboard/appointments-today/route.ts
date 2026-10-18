import { NextRequest, NextResponse } from 'next/server'

const API = process.env.OUTSYDE_API_URL!
const BIZ = process.env.OUTSYDE_BUSINESS_ID!

function proxyHeaders(req: NextRequest): Record<string, string> {
  const token = req.cookies.get('outsyde_access_token')?.value
  const cookieHeader = req.headers.get('cookie')
  return {
    'Content-Type': 'application/json',
    'x-business-id': BIZ ?? '',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(cookieHeader ? { Cookie: cookieHeader } : {}),
  }
}

// Today's Schedule counts only real appointments: requests waiting on the
// business plus confirmed, completed and no show. Unpaid checkouts (draft,
// pending_payment) and expired, canceled or declined bookings are left out.
const TODAY_STATUSES = new Set(['pending_provider', 'confirmed', 'completed', 'no_show'])

export async function GET(req: NextRequest) {
  // Backend doesn't filter by date — fetch a broad page and filter here
  const res = await fetch(`${API}/api/business/appointments?limit=100`, {
    headers: proxyHeaders(req),
    cache: 'no-store',
  })
  const data = await res.json().catch(() => ({ appointments: [] }))
  if (!res.ok) return NextResponse.json(data, { status: res.status })

  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const todayAppts = (data.appointments ?? [])
    .filter((a: { appointmentDate?: string; status?: string }) =>
      a.appointmentDate === today && TODAY_STATUSES.has(String(a.status ?? '')))
    .slice(0, 10)

  return NextResponse.json({ appointments: todayAppts })
}
