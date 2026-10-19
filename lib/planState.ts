// What the Outsyde plan's state means for this business (backend subscription lifecycle, Oct 2026).
// /api/admin/subscription passes through the backend's status plus graceEndsAt (the day listings pause)
// and listingsPaused. Copy rules: commas and periods, no dashes, never the service fee percentage.

export type PlanKind = 'active' | 'late' | 'paused' | 'other'

export interface PlanState {
  kind: PlanKind
  label: string
  note: string | null
  showRenewal: boolean
}

export function formatPlanDay(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', timeZone: 'America/New_York',
  })
}

export function describePlan(raw: { status?: unknown; graceEndsAt?: unknown; listingsPaused?: unknown }): PlanState {
  const status = typeof raw.status === 'string' ? raw.status : ''
  if (raw.listingsPaused === true) {
    return {
      kind: 'paused',
      label: 'PAUSED',
      note: "Your listings are paused because your plan payment hasn't come through. Update your payment and they go live again on their own.",
      showRenewal: false,
    }
  }
  if (status === 'past_due' || status === 'unpaid') {
    const when = typeof raw.graceEndsAt === 'string' && raw.graceEndsAt ? `by ${formatPlanDay(raw.graceEndsAt)}` : 'soon'
    return {
      kind: 'late',
      label: 'PAYMENT LATE',
      note: `We couldn't take your last plan payment. Update your payment ${when} so your listings stay live.`,
      showRenewal: false,
    }
  }
  if (status === 'active' || status === 'trialing') return { kind: 'active', label: 'ACTIVE', note: null, showRenewal: true }
  return { kind: 'other', label: (status || 'unknown').replace(/_/g, ' ').toUpperCase(), note: null, showRenewal: false }
}

export const PLAN_BADGE: Record<PlanKind, { bg: string; color: string }> = {
  active: { bg: '#D1FAE5', color: '#065F46' },
  late: { bg: '#FEF3C7', color: '#92400E' },
  paused: { bg: '#FEE2E2', color: '#991B1B' },
  other: { bg: '#FEE2E2', color: '#991B1B' },
}

/** The backend's reason when it refuses a change (e.g. 409 subscription_inactive), or the fallback. */
export async function refusalMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json()
    const msg = data?.message ?? data?.error?.message ?? (typeof data?.error === 'string' ? data.error : null)
    return typeof msg === 'string' && msg ? msg : fallback
  } catch {
    return fallback
  }
}
