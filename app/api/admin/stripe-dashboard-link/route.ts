import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.OUTSYDE_API_URL!
const BUSINESS_ID = process.env.OUTSYDE_BUSINESS_ID!

export async function GET(req: NextRequest) {
  const res = await fetch(`${API_URL}/api/vendor/stripe-dashboard-link`, {
    headers: {
      'x-business-id': BUSINESS_ID,
      'Cookie': req.headers.get('cookie') ?? '',
    },
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}