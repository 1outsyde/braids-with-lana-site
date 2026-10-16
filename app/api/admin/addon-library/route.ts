import { NextRequest } from 'next/server'
import { forwardToBackend } from '@/lib/addonLibraryProxy'

// GET  → the vendor's add-on library, each with the services it is on
// POST → create a library add-on (attached to no service)
export async function GET(req: NextRequest) {
  return forwardToBackend(req, 'GET', '/api/vendor/addon-library')
}

export async function POST(req: NextRequest) {
  return forwardToBackend(req, 'POST', '/api/vendor/addon-library')
}
