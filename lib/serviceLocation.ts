/**
 * Service location types as stored on vendor_services.service_location_type
 * and returned by outsyde-backend (GET /api/businesses/:id/services,
 * GET /api/vendor/services, PATCH /api/vendor/services/:id).
 *
 * Accepted values (Zod enum on the backend):
 *   'business' | 'alternate' | 'customer' | 'virtual'
 * Default: 'business'
 *
 * There is no separate options endpoint — the picker uses this same enum.
 * Consumer labels are derived from the serviceLocationType on each service
 * record, never invented per-site.
 */

export type ServiceLocationType = 'business' | 'alternate' | 'customer' | 'virtual'

export const SERVICE_LOCATION_TYPES: readonly ServiceLocationType[] = [
  'business',
  'alternate',
  'customer',
  'virtual',
] as const

export function isServiceLocationType(value: unknown): value is ServiceLocationType {
  return value === 'business' || value === 'alternate' || value === 'customer' || value === 'virtual'
}

export function normalizeServiceLocationType(value: unknown): ServiceLocationType {
  return isServiceLocationType(value) ? value : 'business'
}

/** Labels shown to the vendor when setting location (match OutsydeCapture). */
const VENDOR_LABELS: Record<ServiceLocationType, string> = {
  business: 'At my location',
  alternate: 'Alternate address',
  customer: "Customer's location",
  virtual: 'Virtual',
}

/** Labels shown to consumers on service cards / booking (match OutsydeCapture intent). */
const CONSUMER_LABELS: Record<ServiceLocationType, string> = {
  business: 'At our studio',
  alternate: 'At a specific location',
  customer: 'We come to you',
  virtual: 'Virtual appointment',
}

export function vendorLocationLabel(type: string | null | undefined): string {
  return VENDOR_LABELS[normalizeServiceLocationType(type)]
}

export function consumerLocationLabel(type: string | null | undefined): string {
  return CONSUMER_LABELS[normalizeServiceLocationType(type)]
}

export function formatLocationLine(parts: Array<string | null | undefined>): string {
  return parts.filter(Boolean).join(' · ')
}

export interface CustomerServiceAddress {
  customerServiceAddress: string
  customerServiceCity: string
  customerServiceState: string
  customerServiceZipCode: string
}

export function customerAddressPayload(fields: {
  line1: string
  city: string
  state: string
  zipCode: string
}): CustomerServiceAddress {
  return {
    customerServiceAddress: fields.line1.trim(),
    customerServiceCity: fields.city.trim(),
    customerServiceState: fields.state.trim(),
    customerServiceZipCode: fields.zipCode.trim(),
  }
}

export function customerAddressComplete(fields: {
  line1: string
  city: string
  state: string
  zipCode: string
}): boolean {
  return Boolean(
    fields.line1.trim() &&
    fields.city.trim() &&
    fields.state.trim() &&
    fields.zipCode.trim()
  )
}
