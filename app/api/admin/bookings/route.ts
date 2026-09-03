import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.OUTSYDE_API_URL!
const BUSINESS_ID = process.env.OUTSYDE_BUSINESS_ID!

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? ''
  const query = status ? `?status=${status}&businessId=${BUSINESS_ID}` : `?businessId=${BUSINESS_ID}`

  const res = await fetch(`${API_URL}/api/business/appointments${query}`, {
    headers: {
      'x-business-id': BUSINESS_ID,
      'Cookie': req.headers.get('cookie') ?? '',
    },
    cache: 'no-store',
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...rest } = body

  if (!id) return NextResponse.json({ error: 'Appointment ID required' }, { status: 400 })

  const res = await fetch(`${API_URL}/api/appointments/${id}`, {
    method: 'PATCH',
    headers: {
      'x-business-id': BUSINESS_ID,
      'Cookie': req.headers.get('cookie') ?? '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(rest),
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}