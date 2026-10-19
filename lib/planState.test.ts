// Plan state copy: run with `npx tsx lib/planState.test.ts`
import { describePlan } from './planState'
let p = 0, f = 0
const ok = (c: boolean, n: string, d?: unknown) => { if (c) { p++; console.log(`  ✅ ${n}`) } else { f++; console.error(`  ❌ ${n}`, d ?? '') } }
ok(describePlan({ status: 'active' }).kind === 'active' && describePlan({ status: 'active' }).showRenewal, 'active shows renewal')
const late = describePlan({ status: 'past_due', graceEndsAt: '2026-10-23T12:00:00.000Z' })
ok(late.label === 'PAYMENT LATE' && late.note!.includes('by Friday, October 23') && !late.showRenewal, 'late: date named, renewal hidden', late)
ok(describePlan({ status: 'past_due' }).note!.includes('payment soon'), 'late without date says soon')
ok(describePlan({ status: 'past_due', listingsPaused: true }).label === 'PAUSED', 'paused wins')
ok(describePlan({ status: 'canceled' }).label === 'CANCELED', 'other: readable label')
ok(describePlan({}).label === 'UNKNOWN', 'missing status: UNKNOWN, no crash')
for (const s of [late.note, describePlan({ status: 'past_due', listingsPaused: true }).note]) ok(!/[–—]| - /.test(s!) && !/8\s?%/.test(s!), 'no dashes, no fee %')
console.log(`\n${p} passed, ${f} failed`); process.exit(f ? 1 : 0)
