import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.OUTSYDE_API_URL!

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const pointsToRedeem = (body as { pointsToRedeem?: unknown }).pointsToRedeem
  if (typeof pointsToRedeem !== 'number' || !Number.isInteger(pointsToRedeem) || pointsToRedeem <= 0) {
    return NextResponse.json({ success: false, error: 'Please choose a points amount to redeem.' }, { status: 400 })
  }

  const token = req.cookies.get('outsyde_access_token')?.value
  const authHeader = req.headers.get('authorization')
  const res = await fetch(`${BACKEND}/api/points/redeem`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authHeader ? { Authorization: authHeader } : token ? { Authorization: `Bearer ${token}` } : {}),
      Cookie: req.headers.get('cookie') ?? '',
    },
    body: JSON.stringify({ pointsToRedeem }),
  })
  const data = await res.json().catch(() => ({ success: false, error: 'Could not redeem your points. Please try again.' }))
  return NextResponse.json(data, { status: res.status })
}
