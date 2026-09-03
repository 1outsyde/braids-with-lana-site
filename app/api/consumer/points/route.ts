import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.OUTSYDE_API_URL!

export async function GET(req: NextRequest) {
  const token = req.cookies.get('outsyde_access_token')?.value
  const authHeader = req.headers.get('authorization')
  const res = await fetch(`${BACKEND}/api/consumer/points`, {
    headers: {
      ...(authHeader ? { Authorization: authHeader } : token ? { Authorization: `Bearer ${token}` } : {}),
      Cookie: req.headers.get('cookie') ?? '',
    },
  })
  if (res.status === 404 || res.status === 501) {
    return NextResponse.json({ transactions: [], balance: 0 }, { status: 200 })
  }
  return NextResponse.json(await res.json(), { status: res.status })
}
