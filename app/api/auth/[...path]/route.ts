import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.OUTSYDE_API_URL!

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const pathStr = path.join('/')
  const body = await req.text()
  const res = await fetch(`${BACKEND}/api/auth/${pathStr}`, {
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const pathStr = path.join('/')
  const res = await fetch(`${BACKEND}/api/auth/${pathStr}`, {
    headers: {
      Authorization: req.headers.get('authorization') ?? '',
      Cookie: req.headers.get('cookie') ?? '',
    },
  })
  return NextResponse.json(await res.json(), { status: res.status })
}
