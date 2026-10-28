import { NextRequest, NextResponse } from 'next/server'

// The signed-in owner's business, with the private settings the public route leaves out
// (cancellation policy, default deposit, terms). GET /api/vendor/my-business.
const API_URL = process.env.OUTSYDE_API_URL!
const BUSINESS_ID = process.env.OUTSYDE_BUSINESS_ID!

export async function GET(req: NextRequest) {
  const token = req.cookies.get('outsyde_access_token')?.value
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const res = await fetch(`${API_URL}/api/vendor/my-business`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  const data = await res.json().catch(() => ({}))
  // Only this site's business (an owner signed in with another business gets nothing back).
  const biz = (data as { business?: { id?: string } }).business
  if (res.ok && biz?.id !== BUSINESS_ID) return NextResponse.json({ error: 'Not this business' }, { status: 403 })
  return NextResponse.json(data, { status: res.status })
}
