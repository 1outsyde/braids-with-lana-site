import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.OUTSYDE_API_URL!
const BUSINESS_ID = process.env.OUTSYDE_BUSINESS_ID!

function proxyHeaders(req: NextRequest): Record<string, string> {
  const token = req.cookies.get('outsyde_access_token')?.value
  const cookieHeader = req.headers.get('cookie')
  return {
    'Content-Type': 'application/json',
    'x-business-id': BUSINESS_ID ?? '',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(cookieHeader ? { Cookie: cookieHeader } : {}),
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()

  const res = await fetch(`${API_URL}/api/vendor/products/${id}`, {
    method: 'PATCH',
    headers: proxyHeaders(req),
    body: JSON.stringify(body),
  })

  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const res = await fetch(`${API_URL}/api/vendor/products/${id}`, {
    method: 'DELETE',
    headers: proxyHeaders(req),
  })

  if (res.status === 204) {
    return NextResponse.json({ success: true }, { status: 200 })
  }

  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}