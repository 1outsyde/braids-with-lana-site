import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.OUTSYDE_API_URL!

export async function POST(req: NextRequest) {
  const body = await req.text()
  const res = await fetch(`${BACKEND}/api/auth/mobile/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: req.headers.get('cookie') ?? '' },
    body,
  })
  const data = await res.json()
  const response = NextResponse.json(data, { status: res.status })
  res.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') response.headers.append('Set-Cookie', value)
  })
  if (res.ok && data.accessToken) {
    response.cookies.set('outsyde_access_token', data.accessToken, {
      path: '/',
      sameSite: 'lax',
      httpOnly: false,
    })
  }
  return response
}
