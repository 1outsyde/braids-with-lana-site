// Manage Business step 5: run with `npx tsx lib/manageBusiness.test.ts`
import {
  depositInputFrom, lineDetail, parseDefaultDepositInput, policyDraftFrom, policyFromDraft, prefillDeposit,
  newServicePolicy, productDisplayStatus, siteSetupSteps, stockLabel, stockModeOf, stockPayload, termsPayload,
} from './manageBusiness'

let p = 0, f = 0
const ok = (c: boolean, n: string, d?: unknown) => { if (c) { p++; console.log(`  ✅ ${n}`) } else { f++; console.error(`  ❌ ${n}`, d === undefined ? '' : JSON.stringify(d)) } }
const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

// stock
ok(stockModeOf({ inventory: 5, trackInventory: true }) === 'count', 'count')
ok(stockModeOf({ inventory: 0, trackInventory: true }) === 'soldout', 'sold out')
ok(stockModeOf({ inventory: 0, trackInventory: false }) === 'unlimited', 'tracking off = no limit')
ok(stockModeOf({ inventory: null, trackInventory: true }) === 'unlimited', 'no number = no limit')
ok(stockModeOf(null) === 'unlimited', 'new product = no limit')
ok(eq(stockPayload('unlimited', '40'), { inventory: null, trackInventory: false }), 'no limit saves null, never 0')
ok(eq(stockPayload('soldout', ''), { inventory: 0, trackInventory: true }), 'sold out saves 0')
ok(eq(stockPayload('count', ' 12 '), { inventory: 12, trackInventory: true }), 'count saves the number')
for (const bad of ['', '0', '2.5', 'abc', '-3']) ok('error' in stockPayload('count', bad), `count "${bad}" refused`)
ok(stockLabel({ inventory: null, trackInventory: false }) === 'No limit' && stockLabel({ inventory: 0, trackInventory: true }) === 'Sold out' && stockLabel({ inventory: 8, trackInventory: true }) === '8 in stock', 'labels')

// status (camelCase rows; the old page read is_active and showed every live product as paused)
ok(productDisplayStatus({ status: 'live', isActive: true }) === 'live', 'live + active = live')
ok(productDisplayStatus({ status: 'live', isActive: false }) === 'paused', 'live + inactive = paused')
ok(productDisplayStatus({ status: 'paused', isActive: true }) === 'paused', 'paused')
ok(productDisplayStatus({ status: 'draft' }) === 'draft' && productDisplayStatus({ status: 'archived' }) === 'archived', 'draft, archived')
ok(productDisplayStatus({ status: 'live', is_active: true }) === 'live', 'snake rows still read')

// policy
const empty = policyDraftFrom({})
ok(eq(policyFromDraft(empty), { policy: { fullRefundWindow: 'never', hasPartialRefund: false, partialRefundWindow: null, partialRefundPercentage: null, hasCancellationFee: false, cancellationFeeType: null, cancellationFeeAmount: null } }), 'empty business → never refund')
const full = { fullRefundWindow: '48_hours', hasPartialRefund: true, partialRefundWindow: '24_hours', partialRefundPercentage: 50, hasCancellationFee: true, cancellationFeeType: 'flat', cancellationFeeAmount: 1000 }
const d = policyDraftFrom(full)
ok(d.feeInput === '10.00', 'flat fee shown in dollars', d.feeInput)
ok(eq((policyFromDraft(d) as { policy: unknown }).policy, full), 'round trip')
ok('error' in policyFromDraft({ ...empty, hasPartialRefund: true, partialPercentInput: '120' }), 'percent over 100 refused')
ok('error' in policyFromDraft({ ...empty, hasCancellationFee: true, feeInput: '0' }), 'zero fee refused')
ok('error' in policyFromDraft({ ...empty, hasCancellationFee: true, cancellationFeeType: 'percentage', feeInput: '150' }), 'fee % over 100 refused')
ok(policyDraftFrom({ fullRefundWindow: '2_days' }).fullRefundWindow === 'never', 'unknown window falls back')

// deposit
ok(eq(parseDefaultDepositInput(''), { cents: null }) && eq(parseDefaultDepositInput('0'), { cents: null }), 'empty or 0 = no default')
ok(eq(parseDefaultDepositInput('$25'), { cents: 2500 }) && eq(parseDefaultDepositInput('7'), { cents: 700 }), 'dollars to cents')
ok('error' in parseDefaultDepositInput('6.99') && 'error' in parseDefaultDepositInput('2.555'), 'under $7 and bad input refused')
ok(depositInputFrom(2500) === '25.00' && depositInputFrom(null) === '', 'deposit to input')
ok(eq(prefillDeposit(2500, ''), { enabled: true, amount: '25.00' }), 'new service starts with the default')
ok(eq(prefillDeposit(null, ''), { enabled: false, amount: '' }), 'no default = no deposit')
ok(eq(prefillDeposit(5000, '40'), { enabled: false, amount: '' }), 'default not below the price is not used')
ok(eq(termsPayload('  '), { vendorTermsAndConditions: null }) && eq(termsPayload(' Be on time. '), { vendorTermsAndConditions: 'Be on time.' }), 'terms')

ok(eq(newServicePolicy({ ...full }), {}), 'policy never chosen: new service gets nothing extra')
ok(eq(newServicePolicy({ ...full, cancellationPolicySetAt: '2026-10-28T00:00:00Z' }), full), 'chosen policy: new service copies it')
ok(eq(newServicePolicy(null), {}), 'no business: nothing')

// setup checklist
const steps = siteSetupSteps({ businessId: 'b', complete: false, next: 'hours', doneCount: 1, totalCount: 5, steps: [
  { key: 'approval', state: 'waiting', label: 'Business approval', target: null },
  { key: 'first_item', state: 'done', label: 'Add your first product or service', target: 'products' },
  { key: 'hours', state: 'todo', label: 'Set your hours', target: 'hours' },
  { key: 'cancellation_policy', state: 'todo', label: 'Choose your cancellation policy', target: 'booking' },
  { key: 'payouts', state: 'todo', label: 'Connect payouts with Stripe', target: 'payouts' },
] }, { products: false, services: true })
ok(eq(steps, [
  { key: 'first_item', label: 'Add your first product or service', done: true, href: null },
  { key: 'hours', label: 'Set your hours', done: false, href: '/dashboard/availability' },
  { key: 'cancellation_policy', label: 'Choose your cancellation policy', done: false, href: '/dashboard/settings#booking' },
  { key: 'payouts', label: 'Connect payouts with Stripe', done: false, href: '/dashboard/subscription' },
]), 'checklist: waiting left out, pages this site lacks go to the app', steps)
ok(siteSetupSteps(null, { products: true, services: true }) === null && siteSetupSteps({} as never, { products: true, services: true }) === null, 'unusable answer → null')

// orders
ok(lineDetail('Pink', 'Sprinkles, Name: "Mia"') === 'Pink · Sprinkles, Name: "Mia"', 'variant + add-ons')
ok(lineDetail(null, 'Sprinkles') === 'Sprinkles' && lineDetail(undefined, '') === null, 'add-ons only, nothing')

console.log(`\n${p} passed, ${f} failed`)
process.exit(f ? 1 : 0)
