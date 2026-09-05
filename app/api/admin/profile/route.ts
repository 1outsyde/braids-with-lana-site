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

export async function PATCH(req: NextRequest) {
  // Rewrite the incoming body so heroImageUrl maps to the fields the backend expects.
  // PATCH /api/vendor/my-business accepts coverImage + coverMediaType, not heroImageUrl.
  let upstream: string
  try {
    const incoming = await req.json()
    if ('heroImageUrl' in incoming) {
      upstream = JSON.stringify({ coverImage: incoming.heroImageUrl, coverMediaType: 'image' })
    } else {
      upstream = JSON.stringify(incoming)
    }
  } catch {
    upstream = await req.text()
  }

  const res = await fetch(`${API_URL}/api/vendor/my-business`, {
    method: 'PATCH',
    headers: proxyHeaders(req),
    body: upstream,
  })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
