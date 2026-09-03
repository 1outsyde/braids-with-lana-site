import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.OUTSYDE_API_URL!

// Specific route takes precedence over [...path] catch-all.
// Proxy directly to the Outsyde standard customer registration endpoint.
export async function POST(req: NextRequest) {
  const body = await req.text()
  const res = await fetch(`${BACKEND}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: req.headers.get('cookie') ?? '' },
    body,
  })
  const data = await res.json()
  const response = NextResponse.json(data, { status: res.status })
  res.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') response.headers.append('Set-Cookie', value)
  })
  return response
}
