import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.OUTSYDE_API_URL!
const BUSINESS_ID = process.env.OUTSYDE_BUSINESS_ID!

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json()

  const res = await fetch(`${API_URL}/api/vendor/services/${params.id}`, {
    method: 'PATCH',
    headers: {
      'x-business-id': BUSINESS_ID,
      'Cookie': req.headers.get('cookie') ?? '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const res = await fetch(`${API_URL}/api/vendor/services/${params.id}`, {
    method: 'DELETE',
    headers: {
      'x-business-id': BUSINESS_ID,
      'Cookie': req.headers.get('cookie') ?? '',
    },
  })

  if (res.status === 204) {
    return NextResponse.json({ success: true }, { status: 200 })
  }

  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}