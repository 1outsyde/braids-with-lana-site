import { NextRequest } from 'next/server'
import { forwardToBackend } from '@/lib/addonLibraryProxy'

// PATCH  → edit a library add-on (name, description, minutes reach every
//          service; price reaches services that follow the library)
// DELETE → remove it from the library and from every service
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return forwardToBackend(req, 'PATCH', `/api/vendor/addon-library/${encodeURIComponent(id)}`)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return forwardToBackend(req, 'DELETE', `/api/vendor/addon-library/${encodeURIComponent(id)}`)
}
