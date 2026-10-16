import { NextRequest, NextResponse } from 'next/server'

// Server-only helper for the add-on library BFFs (app/api/admin/addon-library/*
// and the price-review route). Same headers as the existing add-on BFFs in
// app/api/admin/services/[id]/addons/*: the vendor's token cookie + this site's
// business id, forwarded to the Outsyde backend.

const API_URL = process.env.OUTSYDE_API_URL!
const BUSINESS_ID = process.env.OUTSYDE_BUSINESS_ID!

function proxyHeaders(req: NextRequest): Record<string, string> {
  const token = req.cookies.get('outsyde_access_token')?.value
  const cookieHeader = req.headers.get('cookie')
  return {
    'Content-Type': 'application/json',
    'x-business-id': BUSINESS_ID ?? '',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(cookieHeader ? { Cookie: cookieHeader } : {}),
  }
}

export async function forwardToBackend(
  req: NextRequest,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
): Promise<NextResponse> {
  const body = method === 'POST' || method === 'PATCH'
    ? JSON.stringify(await req.json().catch(() => ({})))
    : undefined
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: proxyHeaders(req),
    body,
    cache: 'no-store',
  })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
