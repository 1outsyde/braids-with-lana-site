// Client helpers for the add-on library (backend migration 046).
// All calls go through this site's BFFs under /api/admin.

export interface LibraryAddonService {
  serviceId: string
  serviceName: string
  serviceStatus: string
  addonId: string          // the service's own add-on id (what bookings use)
  priceCents: number
  isActive: boolean
  priceSynced: boolean
  needsPriceReview: boolean
}

export interface LibraryAddon {
  id: string
  name: string
  description: string | null
  priceCents: number
  durationMinutes: number
  isActive: boolean
  sortOrder: number
  services: LibraryAddonService[]
}

export interface AddonFields {
  name: string
  description: string | null
  priceCents: number
  durationMinutes: number
}

export interface AttachResult {
  added: string[]
  skipped: Array<{ serviceId: string; reason: 'archived' | 'already_added' | 'limit' }>
}

export interface LibraryEditResult {
  updatedServiceIds: string[]
  customPriceServices: Array<{ serviceId: string; serviceName: string; priceCents: number }>
}

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('outsyde_access_token') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function call<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...authHeaders() },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = (data as { error?: string; message?: string }).error ?? (data as { message?: string }).message
    throw new Error(msg && typeof msg === 'string' ? msg : 'Something went wrong. Please try again.')
  }
  return data as T
}

export const addonLibraryApi = {
  list: async () => (await call<{ addons: LibraryAddon[] }>('GET', '/api/admin/addon-library')).addons ?? [],
  create: (fields: AddonFields) => call<{ addon: LibraryAddon }>('POST', '/api/admin/addon-library', fields),
  update: (id: string, fields: Partial<AddonFields>) =>
    call<LibraryEditResult & { addon: LibraryAddon }>('PATCH', `/api/admin/addon-library/${id}`, fields),
  remove: (id: string) =>
    call<{ success: boolean; removedFromServiceIds: string[] }>('DELETE', `/api/admin/addon-library/${id}`),
  setActive: (id: string, isActive: boolean, serviceIds: string[]) =>
    call<{ updatedServiceIds: string[] }>('POST', `/api/admin/addon-library/${id}/active`, { isActive, serviceIds }),
  attach: (id: string, serviceIds: string[]) =>
    call<AttachResult>('POST', `/api/admin/addon-library/${id}/services`, { serviceIds }),
  priceReview: (serviceId: string, serviceAddonId: string, action: 'sync' | 'keep') =>
    call<{ addon: unknown }>('POST', `/api/admin/services/${serviceId}/addons/${serviceAddonId}/price-review`, { action }),
}

export function money(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

// Plain-language summary of an attach result, e.g.
// "Added to 2 services. Skipped Fill (already has it)."
export function describeAttach(result: AttachResult, nameOf: (serviceId: string) => string): string {
  const parts: string[] = []
  const n = result.added.length
  parts.push(n === 0 ? 'Not added to any new service.' : `Added to ${n} service${n === 1 ? '' : 's'}.`)
  const why: Record<string, string> = {
    already_added: 'already has it',
    limit: 'already has 20 add-ons',
    archived: 'archived',
  }
  if (result.skipped.length > 0) {
    parts.push(`Skipped ${result.skipped.map((s) => `${nameOf(s.serviceId)} (${why[s.reason] ?? s.reason})`).join(', ')}.`)
  }
  return parts.join(' ')
}
