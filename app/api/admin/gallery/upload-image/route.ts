import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.OUTSYDE_API_URL!
const BUSINESS_ID = process.env.OUTSYDE_BUSINESS_ID!

export async function POST(req: NextRequest) {
  try {
    const incoming = await req.formData()
    const forwarded = new FormData()
    for (const [key, value] of incoming.entries()) {
      forwarded.append(key === 'image' ? 'file' : key, value)
    }
    forwarded.append('folder', 'gallery')
    forwarded.append('businessId', BUSINESS_ID ?? '')

    const token = req.cookies.get('outsyde_access_token')?.value
    const cookieHeader = req.headers.get('cookie')

    const res = await fetch(`${API_URL}/api/media/upload-image`, {
      method: 'POST',
      headers: {
        'x-business-id': BUSINESS_ID ?? '',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      body: forwarded,
    })

    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 })
  }
}
