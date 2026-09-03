import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.OUTSYDE_API_URL!

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const token = req.cookies.get('outsyde_access_token')?.value
  const authHeader = req.headers.get('authorization')
  const res = await fetch(`${BACKEND}/api/media/upload-image`, {
    method: 'POST',
    headers: {
      ...(authHeader ? { Authorization: authHeader } : token ? { Authorization: `Bearer ${token}` } : {}),
      Cookie: req.headers.get('cookie') ?? '',
    },
    body: formData,
  })
  return NextResponse.json(await res.json(), { status: res.status })
}
