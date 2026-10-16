import { NextRequest } from 'next/server'
import { forwardToBackend } from '@/lib/addonLibraryProxy'

// POST { serviceIds } → attach the library add-on to the services the vendor picked
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return forwardToBackend(req, 'POST', `/api/vendor/addon-library/${encodeURIComponent(id)}/services`)
}
