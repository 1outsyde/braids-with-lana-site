// Run with: npx tsx tests/referral.test.ts   (no server needed)
import { existsSync, readFileSync } from 'node:fs'
import {
  normalizeReferralCode, inviteLinkFor, rememberReferralCode, storedReferralCode, clearReferralCode,
  referralCounts, REFERRAL_COPY, referralShareMessage, REFERRAL_STORE_KEY,
  markReferralApplied, referralAppliedNote, clearReferralAppliedNote,
} from '../lib/referral'

let passed = 0, failed = 0
function assert(cond: boolean, name: string, detail?: unknown) {
  if (cond) { passed++; console.log(`  ✅ ${name}`) }
  else { failed++; console.error(`  ❌ ${name}`, detail === undefined ? '' : JSON.stringify(detail)) }
}
const mem = () => { const m = new Map<string, string>(); return { m, getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) } }

console.log('\n1. Codes and links')
assert(normalizeReferralCode(' ab3k9pq2 ') === 'AB3K9PQ2', 'trims and uppercases')
assert(normalizeReferralCode('AB-12') === null && normalizeReferralCode('A'.repeat(21)) === null && normalizeReferralCode('') === null && normalizeReferralCode(7) === null, 'rejects bad codes')
assert(inviteLinkFor('https://shop.example/', 'ab12') === 'https://shop.example/register?ref=AB12', "link opens this site's signup")
assert(referralShareMessage('https://x/register?ref=A').endsWith(' https://x/register?ref=A'), 'share message ends with the link')

console.log('\n2. Kept for this visit')
const s = mem()
rememberReferralCode('bad code!', s)
assert(s.m.size === 0, 'invalid code is not kept')
rememberReferralCode('ab12', s)
assert(s.m.get(REFERRAL_STORE_KEY) === 'AB12' && storedReferralCode(s) === 'AB12', 'valid code kept, uppercased')
s.m.set(REFERRAL_STORE_KEY, '<script>')
assert(storedReferralCode(s) === null, 'a tampered stored value is ignored')
rememberReferralCode('ab12', s); clearReferralCode(s)
assert(storedReferralCode(s) === null, 'cleared after signup')
assert(storedReferralCode(null) === null, 'no storage: nothing, no throw')
const broken = { getItem: () => { throw new Error('x') }, setItem: () => { throw new Error('x') }, removeItem: () => { throw new Error('x') } }
rememberReferralCode('ab12', broken); clearReferralCode(broken)
assert(storedReferralCode(broken) === null, 'storage that throws never breaks signup')

const n = mem()
assert(!referralAppliedNote(n), 'no applied note by default')
markReferralApplied(n)
assert(referralAppliedNote(n), 'applied note set before the redirect')
clearReferralAppliedNote(n)
assert(!referralAppliedNote(n) && !referralAppliedNote(broken) && !referralAppliedNote(null), 'note cleared; broken or missing storage reads false')

console.log('\n3. Counts and copy')
const c = referralCounts({ totalReferrals: 3, pendingReferrals: 1, qualifyingReferrals: 1, totalPointsEarned: 2500 })
assert(c.invited === 3 && c.waiting === 2 && c.earned === 2500, 'counts', c)
assert(referralCounts(undefined).invited === 0, 'no stats: zeros')
for (const [k, v] of Object.entries(REFERRAL_COPY)) assert(!/(—|–| - )/.test(v) && !/%/.test(v), `copy ${k}: no dashes, no percentage`)
assert(REFERRAL_COPY.cardBody.includes('2,500') && REFERRAL_COPY.cardBody.includes('$5') && REFERRAL_COPY.cardBody.includes('$10'), 'card names 2,500 points, $5 and $10')

console.log('\n4. Wiring')
const reg = readFileSync('app/(auth)/register/page.tsx', 'utf8')
assert(reg.includes('useSyncExternalStore') && reg.includes('rememberReferralCode') && reg.includes('REFERRAL_COPY.fieldLabel'), 'register page reads ?ref, keeps it, shows the field')
assert(reg.includes('markReferralApplied()') && !/invite=applied/.test(reg), 'register sets the one time applied note before the redirect')
const auth = readFileSync('lib/auth-context.tsx', 'utf8')
assert(auth.includes('storedReferralCode') && auth.includes('clearReferralCode') && /\.\.\.\(referralCode \? \{ referralCode \} : \{\}\)/.test(auth), 'register() sends the code only when there is one, then clears it')
const bff = 'app/api/consumer/referral/route.ts'
assert(existsSync(bff) && readFileSync(bff, 'utf8').includes('/api/referral/code'), 'invite BFF proxies /api/referral/code')
const acct = ['app/(public)/account/page.tsx', 'app/account/page.tsx'].find((f) => existsSync(f))!
const a = readFileSync(acct, 'utf8')
assert(a.includes('/api/consumer/referral') && a.includes('inviteLinkFor') && a.includes('REFERRAL_COPY.applied') && a.includes('referralAppliedNote') && a.includes('clearReferralAppliedNote'), 'account page has the invite card and the one time applied banner')
assert(!/business-referral|Refer a business/i.test(a), 'no $25 business card on the vendor site (Legend)')

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
