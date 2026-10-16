import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.OUTSYDE_API_URL!
const BUSINESS_ID = process.env.OUTSYDE_BUSINESS_ID!

function proxyHeaders(req: NextRequest): Record<string, string> {
  const token = req.cookies.get('outsyde_access_token')?.value
  return {
    'Content-Type': 'application/json',
    'x-business-id': BUSINESS_ID,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ holdId: string }> }
) {
  const { holdId } = await params
  const res = await fetch(`${API_URL}/api/booking/hold/${holdId}`, {
    method: 'DELETE',
    headers: proxyHeaders(req),
  })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
