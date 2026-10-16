import { NextRequest } from 'next/server'
import { forwardToBackend } from '@/lib/addonLibraryProxy'

// POST { isActive, serviceIds } → switch the add-on on/off in the library and
// on the services the vendor ticked
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return forwardToBackend(req, 'POST', `/api/vendor/addon-library/${encodeURIComponent(id)}/active`)
}
