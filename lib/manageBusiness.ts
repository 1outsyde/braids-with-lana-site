// Manage Business step 5 (2026-10-28): the same rules the Outsyde app uses, for this site's dashboard.
//   npx tsx lib/manageBusiness.test.ts
//
//  - Stock is optional: No limit, Count it, or Sold out (backend #377). No limit is saved as
//    inventory null + trackInventory false, never 0 (0 means sold out at checkout).
//  - Business cancellation policy: PUT /api/vendor/my-business/cancellation-policy (backend #374).
//    Same checks as the backend's parseCancellationPolicy, so a problem shows in the form.
//  - Default deposit: PATCH /api/vendor/my-business { defaultDepositCents }. It only pre-fills NEW
//    services; it never changes a service that already exists.
//  - Setup checklist: GET /api/vendor/setup-status, the same list the app shows.
//  - Orders: GET /api/business/orders?format=snake; a line bought with add-ons has addons_label.

// ── Stock ───────────────────────────────────────────────────────────────────
export type StockMode = 'unlimited' | 'count' | 'soldout'

export interface StockFields {
  inventory?: number | null
  trackInventory?: boolean | null
}

export function stockModeOf(p: StockFields | null | undefined): StockMode {
  if (!p || p.trackInventory === false || p.inventory === null || p.inventory === undefined) return 'unlimited'
  return p.inventory <= 0 ? 'soldout' : 'count'
}

export function stockPayload(
  mode: StockMode,
  countInput: string,
): { inventory: number | null; trackInventory: boolean } | { error: string } {
  if (mode === 'unlimited') return { inventory: null, trackInventory: false }
  if (mode === 'soldout') return { inventory: 0, trackInventory: true }
  const raw = countInput.trim()
  const n = Number(raw)
  if (!raw || !Number.isInteger(n) || n < 1) return { error: 'Enter how many you have, or pick No limit or Sold out.' }
  if (n > 1_000_000) return { error: 'That stock number is too large.' }
  return { inventory: n, trackInventory: true }
}

export function stockLabel(p: StockFields | null | undefined): string {
  const mode = stockModeOf(p)
  if (mode === 'unlimited') return 'No limit'
  if (mode === 'soldout') return 'Sold out'
  return `${p!.inventory} in stock`
}

export const STOCK_CHOICES: { value: StockMode; label: string; hint: string }[] = [
  { value: 'unlimited', label: 'No limit', hint: 'Made to order or always on hand. Never sells out.' },
  { value: 'count', label: 'Count it', hint: 'Sells out when this many are bought.' },
  { value: 'soldout', label: 'Sold out', hint: 'Customers see it as sold out.' },
]

// ── Product status (GET /api/vendor/products returns camelCase rows) ────────
export type ProductStatus = 'live' | 'paused' | 'draft' | 'archived'

export function productDisplayStatus(p: { status?: string | null; isActive?: boolean | null; is_active?: boolean | null }): ProductStatus {
  const active = p.isActive ?? p.is_active ?? true
  if (p.status === 'paused') return 'paused'
  if (p.status === 'live') return active ? 'live' : 'paused'
  if (p.status === 'archived') return 'archived'
  return 'draft'
}

// ── Cancellation policy ─────────────────────────────────────────────────────
export type RefundWindow = '1_week' | '48_hours' | '24_hours' | '1_hour' | 'never'

export const REFUND_WINDOWS: { value: RefundWindow; label: string }[] = [
  { value: '1_week', label: '1 week' },
  { value: '48_hours', label: '48 hours' },
  { value: '24_hours', label: '24 hours' },
  { value: '1_hour', label: '1 hour' },
  { value: 'never', label: 'Never' },
]
const isWindow = (v: unknown): v is RefundWindow =>
  typeof v === 'string' && REFUND_WINDOWS.some(w => w.value === v)

export interface PolicyDraft {
  fullRefundWindow: RefundWindow
  hasPartialRefund: boolean
  partialRefundWindow: RefundWindow
  partialPercentInput: string
  hasCancellationFee: boolean
  cancellationFeeType: 'flat' | 'percentage'
  feeInput: string
}

export interface BusinessPolicyFields {
  fullRefundWindow?: string | null
  hasPartialRefund?: boolean | null
  partialRefundWindow?: string | null
  partialRefundPercentage?: number | null
  hasCancellationFee?: boolean | null
  cancellationFeeType?: string | null
  cancellationFeeAmount?: number | null
}

export interface CancellationPolicy {
  fullRefundWindow: RefundWindow
  hasPartialRefund: boolean
  partialRefundWindow: RefundWindow | null
  partialRefundPercentage: number | null
  hasCancellationFee: boolean
  cancellationFeeType: 'flat' | 'percentage' | null
  cancellationFeeAmount: number | null
}

export function policyDraftFrom(b: BusinessPolicyFields | null | undefined): PolicyDraft {
  const feeType = b?.cancellationFeeType === 'percentage' ? 'percentage' : 'flat'
  const fee = b?.cancellationFeeAmount
  return {
    fullRefundWindow: isWindow(b?.fullRefundWindow) ? (b!.fullRefundWindow as RefundWindow) : 'never',
    hasPartialRefund: b?.hasPartialRefund === true,
    partialRefundWindow: isWindow(b?.partialRefundWindow) ? (b!.partialRefundWindow as RefundWindow) : '24_hours',
    partialPercentInput: b?.partialRefundPercentage != null ? String(b.partialRefundPercentage) : '',
    hasCancellationFee: b?.hasCancellationFee === true,
    cancellationFeeType: feeType,
    feeInput: fee != null ? (feeType === 'flat' ? (fee / 100).toFixed(2) : String(fee)) : '',
  }
}

export function policyFromDraft(d: PolicyDraft): { policy: CancellationPolicy } | { error: string } {
  let partialRefundPercentage: number | null = null
  if (d.hasPartialRefund) {
    const n = Number(d.partialPercentInput.trim())
    if (!d.partialPercentInput.trim() || !Number.isInteger(n) || n < 1 || n > 100) {
      return { error: 'Enter the percentage customers get back, 1 to 100.' }
    }
    partialRefundPercentage = n
  }
  let cancellationFeeAmount: number | null = null
  if (d.hasCancellationFee) {
    const raw = d.feeInput.trim().replace(/^\$/, '')
    if (d.cancellationFeeType === 'flat') {
      if (!/^\d+(\.\d{0,2})?$/.test(raw) || Math.round(parseFloat(raw) * 100) < 1) {
        return { error: 'Enter the cancellation fee in dollars, like 20 or 20.50.' }
      }
      cancellationFeeAmount = Math.round(parseFloat(raw) * 100)
    } else {
      const n = Number(raw)
      if (!raw || !Number.isInteger(n) || n < 1 || n > 100) {
        return { error: 'Enter the cancellation fee as a percentage, 1 to 100.' }
      }
      cancellationFeeAmount = n
    }
  }
  return {
    policy: {
      fullRefundWindow: d.fullRefundWindow,
      hasPartialRefund: d.hasPartialRefund,
      partialRefundWindow: d.hasPartialRefund ? d.partialRefundWindow : null,
      partialRefundPercentage,
      hasCancellationFee: d.hasCancellationFee,
      cancellationFeeType: d.hasCancellationFee ? d.cancellationFeeType : null,
      cancellationFeeAmount,
    },
  }
}

// ── Default deposit ─────────────────────────────────────────────────────────
export const MIN_DEPOSIT_CENTS = 700

export function parseDefaultDepositInput(input: string): { cents: number | null } | { error: string } {
  const raw = input.trim().replace(/^\$/, '')
  if (raw === '') return { cents: null }
  if (!/^\d+(\.\d{0,2})?$/.test(raw)) return { error: 'Enter the deposit in dollars, like 25 or 25.50.' }
  const cents = Math.round(parseFloat(raw) * 100)
  if (cents === 0) return { cents: null }
  if (cents < MIN_DEPOSIT_CENTS) return { error: 'Deposit must be at least $7.00.' }
  return { cents }
}

export const depositInputFrom = (cents: number | null | undefined): string =>
  typeof cents === 'number' && cents > 0 ? (cents / 100).toFixed(2) : ''

/**
 * The deposit a NEW service starts with: the business default, unless it is not below the
 * service price (a deposit has to leave something to pay at the appointment).
 */
export function prefillDeposit(defaultCents: number | null | undefined, priceInput: string): { enabled: boolean; amount: string } {
  if (typeof defaultCents !== 'number' || defaultCents <= 0) return { enabled: false, amount: '' }
  const price = Math.round(parseFloat(priceInput) * 100)
  if (Number.isFinite(price) && price > 0 && defaultCents >= price) return { enabled: false, amount: '' }
  return { enabled: true, amount: (defaultCents / 100).toFixed(2) }
}

/**
 * A NEW service copies the business cancellation policy once the business has chosen one, like the
 * app does. Nothing is sent before that (the service keeps the backend default). Existing services
 * are never changed by this.
 */
export function newServicePolicy(
  b: (BusinessPolicyFields & { cancellationPolicySetAt?: string | null }) | null | undefined,
): Partial<CancellationPolicy> {
  if (!b || !b.cancellationPolicySetAt) return {}
  const parsed = policyFromDraft(policyDraftFrom(b))
  return 'policy' in parsed ? parsed.policy : {}
}

/** Business terms: an emptied box clears them (null), like the app. */
export const termsPayload = (text: string): { vendorTermsAndConditions: string | null } => ({
  vendorTermsAndConditions: text.trim() ? text.trim() : null,
})

// ── Setup checklist ─────────────────────────────────────────────────────────
export interface SetupStatusStep {
  key: string
  state: 'done' | 'todo' | 'waiting'
  label: string
  target: string | null
  missingCount?: number
}
export interface SetupStatus {
  businessId: string
  complete: boolean
  next: string | null
  doneCount: number
  totalCount: number
  steps: SetupStatusStep[]
}

export interface SiteSetupStep {
  key: string
  label: string
  done: boolean
  /** Where to do it on this site; null = in the Outsyde app. */
  href: string | null
}

/**
 * Server checklist → this dashboard. Waiting steps (approval) are left out. A step whose page this
 * site does not have says "In the Outsyde app". null when the answer can't be used.
 */
export function siteSetupSteps(
  status: SetupStatus | null | undefined,
  pages: { products: boolean; services: boolean },
): SiteSetupStep[] | null {
  if (!status || !Array.isArray(status.steps)) return null
  const hrefFor = (target: string | null): string | null => {
    switch (target) {
      case 'products': return pages.products ? '/dashboard/products' : null
      case 'services': return pages.services ? '/dashboard/services' : null
      case 'hours': return '/dashboard/availability'
      case 'booking': return '/dashboard/settings#booking'
      case 'payouts': return '/dashboard/subscription'
      default: return null
    }
  }
  const out: SiteSetupStep[] = []
  for (const s of status.steps) {
    if (!s || typeof s.key !== 'string' || typeof s.label !== 'string' || s.state === 'waiting') continue
    out.push({ key: s.key, label: s.label, done: s.state === 'done', href: hrefFor(s.target) })
  }
  return out
}

// ── Orders ──────────────────────────────────────────────────────────────────
/** Variation and add-ons for one order line, e.g. `Pink · Sprinkles, Name: "Mia"`. */
export function lineDetail(variantLabel?: string | null, addonsLabel?: string | null): string | null {
  const parts = [variantLabel, addonsLabel].filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
  return parts.length ? parts.join(' · ') : null
}
