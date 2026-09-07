import { NextRequest, NextResponse } from 'next/server'

const API = process.env.OUTSYDE_API_URL!
const BIZ = process.env.OUTSYDE_BUSINESS_ID!

function proxyHeaders(req: NextRequest): Record<string, string> {
  const token = req.cookies.get('outsyde_access_token')?.value
  const cookieHeader = req.headers.get('cookie')
  return {
    'Content-Type': 'application/json',
    'x-business-id': BIZ ?? '',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(cookieHeader ? { Cookie: cookieHeader } : {}),
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ blockId: string }> }
) {
  const { blockId } = await params
  const body = await req.json().catch(() => null)
  const res = await fetch(`${API}/api/businesses/me/blocks/${blockId}`, {
    method: 'PATCH',
    headers: proxyHeaders(req),
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ blockId: string }> }
) {
  const { blockId } = await params
  const res = await fetch(`${API}/api/businesses/me/blocks/${blockId}`, {
    method: 'DELETE',
    headers: proxyHeaders(req),
  })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
