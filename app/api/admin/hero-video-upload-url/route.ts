import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.OUTSYDE_API_URL!
const BUSINESS_ID = process.env.OUTSYDE_BUSINESS_ID!

// POST /api/admin/hero-video-upload-url → backend POST /api/media/video-upload-url
// Returns { uploadUrl, uploadId }. The browser PUTs the video straight to Mux,
// then saves the upload id through PATCH /api/admin/profile { heroVideoUploadId }.
export async function POST(req: NextRequest) {
  try {
    const cookieToken = req.cookies.get('outsyde_access_token')?.value
    const auth = req.headers.get('authorization')
    const cookieHeader = req.headers.get('cookie')
    const res = await fetch(`${API_URL}/api/media/video-upload-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-business-id': BUSINESS_ID ?? '',
        ...(cookieToken ? { Authorization: `Bearer ${cookieToken}` } : auth ? { Authorization: auth } : {}),
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Could not start the video upload.' }, { status: 500 })
  }
}
