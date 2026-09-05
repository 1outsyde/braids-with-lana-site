import { NextResponse } from 'next/server'

const API_URL = process.env.OUTSYDE_API_URL!
const BUSINESS_ID = process.env.OUTSYDE_BUSINESS_ID!

export async function GET() {
  const res = await fetch(`${API_URL}/api/businesses/${BUSINESS_ID}/services`, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
