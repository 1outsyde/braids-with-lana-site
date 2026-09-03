import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.OUTSYDE_API_URL!

export async function PATCH(req: NextRequest) {
  const body = await req.text()
  const token = req.cookies.get('outsyde_access_token')?.value
  const authHeader = req.headers.get('authorization')
  const res = await fetch(`${BACKEND}/api/users/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(authHeader ? { Authorization: authHeader } : token ? { Authorization: `Bearer ${token}` } : {}),
      Cookie: req.headers.get('cookie') ?? '',
    },
    body,
  })
  return NextResponse.json(await res.json(), { status: res.status })
}
