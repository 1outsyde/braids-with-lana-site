import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.OUTSYDE_API_URL!
const BUSINESS_ID = process.env.OUTSYDE_BUSINESS_ID!

export async function PATCH(req: NextRequest) {
  try {
    const token =
      req.headers.get('authorization')?.replace('Bearer ', '') ??
      req.cookies.get('outsyde_access_token')?.value
    const cookieHeader = req.headers.get('cookie')
    const body = await req.json()

    const res = await fetch(`${API_URL}/api/vendor/my-business`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-business-id': BUSINESS_ID ?? '',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      body: JSON.stringify({ siteConfig: body }),
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Failed to save site config.' }, { status: 500 })
  }
}
