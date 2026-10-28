import { NextRequest, NextResponse } from 'next/server'

// PUT /api/vendor/my-business/cancellation-policy (backend #374): saves the business policy and
// marks it as chosen. New services copy it; existing services keep their own.
const API_URL = process.env.OUTSYDE_API_URL!
const BUSINESS_ID = process.env.OUTSYDE_BUSINESS_ID!

export async function PUT(req: NextRequest) {
  const token = req.cookies.get('outsyde_access_token')?.value
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const body = await req.text()
  const res = await fetch(`${API_URL}/api/vendor/my-business/cancellation-policy`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'x-business-id': BUSINESS_ID ?? '' },
    body,
  })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
