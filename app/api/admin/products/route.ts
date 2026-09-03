import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.OUTSYDE_API_URL!
const BUSINESS_ID = process.env.OUTSYDE_BUSINESS_ID!

export async function GET(req: NextRequest) {
  const res = await fetch(`${API_URL}/api/vendor/products?businessId=${BUSINESS_ID}&includeInactive=true`, {
    headers: {
      'x-business-id': BUSINESS_ID,
      'Cookie': req.headers.get('cookie') ?? '',
    },
    cache: 'no-store',
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  const res = await fetch(`${API_URL}/api/vendor/products`, {
    method: 'POST',
    headers: {
      'x-business-id': BUSINESS_ID,
      'Cookie': req.headers.get('cookie') ?? '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...body, businessId: BUSINESS_ID }),
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}