import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.OUTSYDE_API_URL!
const BUSINESS_ID = process.env.OUTSYDE_BUSINESS_ID!

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const params = new URLSearchParams()
  params.set('providerType', 'business')
  params.set('providerId', BUSINESS_ID)

  const date = searchParams.get('date')
  const serviceDurationMinutes = searchParams.get('serviceDurationMinutes')
  const staffMemberId = searchParams.get('staffMemberId')

  if (!date || !serviceDurationMinutes) {
    return NextResponse.json({ error: 'date and serviceDurationMinutes are required' }, { status: 400 })
  }

  params.set('date', date)
  params.set('serviceDurationMinutes', serviceDurationMinutes)
  if (staffMemberId) params.set('staffMemberId', staffMemberId)

  const res = await fetch(`${API_URL}/api/availability/slots?${params.toString()}`, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
