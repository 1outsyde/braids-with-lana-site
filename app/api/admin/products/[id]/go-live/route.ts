import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.OUTSYDE_API_URL!
const BUSINESS_ID = process.env.OUTSYDE_BUSINESS_ID!

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const res = await fetch(`${API_URL}/api/vendor/products/${params.id}/go-live`, {
    method: 'POST',
    headers: {
      'x-business-id': BUSINESS_ID,
      'Cookie': req.headers.get('cookie') ?? '',
      'Content-Type': 'application/json',
    },
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}