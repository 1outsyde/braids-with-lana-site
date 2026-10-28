import { NextRequest, NextResponse } from 'next/server'

// GET /api/vendor/setup-status (backend #374): the same setup checklist the Outsyde app shows.
const API_URL = process.env.OUTSYDE_API_URL!
const BUSINESS_ID = process.env.OUTSYDE_BUSINESS_ID!

export async function GET(req: NextRequest) {
  const token = req.cookies.get('outsyde_access_token')?.value
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const res = await fetch(`${API_URL}/api/vendor/setup-status`, {
    headers: { Authorization: `Bearer ${token}`, 'x-business-id': BUSINESS_ID ?? '' },
    cache: 'no-store',
  })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
