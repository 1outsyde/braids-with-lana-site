import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  let email: string
  try {
    const body = await req.json()
    email = body?.email ?? ''
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  try {
    await fetch(`${process.env.OUTSYDE_API_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, redirect_uri: 'https://braidswithlove.com' }),
    })
  } catch {
    // Anti-enumeration: always 200
  }

  return NextResponse.json({ success: true, message: 'If that email exists, a reset link has been sent.' })
}
