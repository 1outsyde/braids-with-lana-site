import { NextRequest } from 'next/server'
import { forwardToBackend } from '@/lib/addonLibraryProxy'

// POST { action: 'sync' | 'keep' } → answer to "Library price is now $X. Sync this service?"
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; addonId: string }> }
) {
  const { id, addonId } = await params
  return forwardToBackend(
    req,
    'POST',
    `/api/vendor/services/${encodeURIComponent(id)}/addons/${encodeURIComponent(addonId)}/price-review`,
  )
}
