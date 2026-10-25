// Friend referrals on this site (Outsyde referral Step 6, 2026-10-24). Shared file: the same copy lives on every
// Outsyde vendor site, so change it everywhere at once.
//
// Rules live on the Outsyde backend: 2,500 points each ($5) when the friend's first purchase of $10 or more is final;
// a code is used once, within 30 days of joining, by a new customer. The invite link opens THIS site's signup
// (/register?ref=CODE, decided by Legend 2026-10-24). The code is kept for this visit only (sessionStorage), so a
// signup inside booking carries it too. Copy rules: real punctuation, no dashes, never a percentage.

const CODE_RE = /^[A-Za-z0-9]{1,20}$/
export const REFERRAL_STORE_KEY = 'outsyde_friend_ref'

/** A code the backend accepts (letters and digits, up to 20), uppercased, or null. */
export function normalizeReferralCode(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const code = raw.trim()
  return CODE_RE.test(code) ? code.toUpperCase() : null
}

/** This site's signup with the code, for sharing. */
export function inviteLinkFor(origin: string, code: string): string {
  return `${origin.replace(/\/+$/, '')}/register?ref=${encodeURIComponent(code.toUpperCase())}`
}

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
const session = (): Store | null => {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null
  } catch {
    return null
  }
}

/** Keep a valid code for this visit. Invalid input is ignored. */
export function rememberReferralCode(raw: unknown, store: Store | null = session()): void {
  const code = normalizeReferralCode(raw)
  if (!code || !store) return
  try { store.setItem(REFERRAL_STORE_KEY, code) } catch { /* private mode */ }
}

export function storedReferralCode(store: Store | null = session()): string | null {
  if (!store) return null
  try { return normalizeReferralCode(store.getItem(REFERRAL_STORE_KEY)) } catch { return null }
}

export function clearReferralCode(store: Store | null = session()): void {
  if (!store) return
  try { store.removeItem(REFERRAL_STORE_KEY) } catch { /* ignore */ }
}

// A one time "your code applied" note for the account page, set right before the redirect after signup.
export const REFERRAL_APPLIED_KEY = 'outsyde_invite_applied'

export function markReferralApplied(store: Store | null = session()): void {
  if (!store) return
  try { store.setItem(REFERRAL_APPLIED_KEY, '1') } catch { /* ignore */ }
}

/** Read the note (no side effects, safe in render). */
export function referralAppliedNote(store: Store | null = session()): boolean {
  if (!store) return false
  try { return store.getItem(REFERRAL_APPLIED_KEY) === '1' } catch { return false }
}

export function clearReferralAppliedNote(store: Store | null = session()): void {
  if (!store) return
  try { store.removeItem(REFERRAL_APPLIED_KEY) } catch { /* ignore */ }
}

export interface FriendReferralStats {
  totalReferrals?: number
  pendingReferrals?: number
  qualifyingReferrals?: number
  completedReferrals?: number
  totalPointsEarned?: number
}

/** Numbers for the invite card. Waiting = joined, no final first purchase yet. */
export function referralCounts(stats: FriendReferralStats | undefined | null) {
  return {
    invited: stats?.totalReferrals ?? 0,
    waiting: (stats?.pendingReferrals ?? 0) + (stats?.qualifyingReferrals ?? 0),
    earned: stats?.totalPointsEarned ?? 0,
  }
}

export const REFERRAL_COPY = {
  cardTitle: 'Invite Friends',
  cardBody:
    'Share your link. When a friend joins and makes a first purchase of $10 or more, you each get 2,500 Outsyde loyalty rewards points, worth $5.',
  share:
    'Join me on Outsyde. Use my link and we each get 2,500 Outsyde loyalty rewards points, worth $5, after your first purchase of $10 or more.',
  fieldLabel: 'Invite code (optional)',
  fieldHint: 'Got a code from a friend? Enter it here.',
  applied: 'Invite code applied. You and your friend each get 2,500 points after your first purchase of $10 or more.',
  fineprint: 'For new Outsyde customers. A code works within 30 days of joining.',
  copied: 'Link copied',
} as const

export function referralShareMessage(link: string): string {
  return `${REFERRAL_COPY.share} ${link}`
}
