import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.OUTSYDE_API_URL!

// Friend invite card (Outsyde referral Step 6): the signed in customer's code and counts from the
// Outsyde backend. Same auth forwarding as /api/consumer/points.
export async function GET(req: NextRequest) {
  const token = req.cookies.get('outsyde_access_token')?.value
  const authHeader = req.headers.get('authorization')
  const res = await fetch(`${BACKEND}/api/referral/code`, {
    headers: {
      ...(authHeader ? { Authorization: authHeader } : token ? { Authorization: `Bearer ${token}` } : {}),
      Cookie: req.headers.get('cookie') ?? '',
    },
    cache: 'no-store',
  })
  const data = await res.json().catch(() => ({ error: 'Bad response' }))
  return NextResponse.json(data, { status: res.status })
}
