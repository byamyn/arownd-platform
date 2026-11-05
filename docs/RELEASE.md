# Arownd release readiness

## Release decision

**Status: not yet cleared for a pilot release.** The app build, TypeScript, unit/UI suite and static UI checker pass in this checkout. Those checks use local code and, for commerce journeys, a test-only Supabase fake. They do not prove a real backend, account, inventory transaction, order, notification, carrier assignment, or payment flow works.

## Ready for code review

- Fixed carrier pending-queue query gating for approved companies.
- Fixed checkout's per-variant React identity and exposed selected variant values in checkout review.
- Fixed a stale selected-location race while the store map is loading.
- Fixed four React Hooks dependency/cleanup issues in push registration, map-picker state, category pagination, and map marker cleanup.
- Fixed the `/explore` route mismatch: it rendered map search while home links and product-discovery translations targeted a catalog. `/explore` now shows searchable/paginated products; `/map` remains the map route.
- Unified shopper and merchant bottom-navigation styling and safe-area behavior. Merchant navigation remains visible at desktop widths; its role-specific routes and permissions are unchanged.
- Applied the shared responsive page frame to the merchant dashboard, delivery dashboard and customer orders list, and aligned delivery-status badges with existing semantic design tokens.
- Extended the shared page frame to merchant product creation, store settings and order detail, and unified sticky page-header alignment/surface treatment.
- Added regression assertions for these repairs. The journey suite uses only the fake backend; the store-location component test stubs MapLibre APIs and verifies selection state without WebGL.
- No new dependency or database migration was introduced.

## Verification run

Run these commands from `artifacts/arownd` in order:

```sh
npx tsc --noEmit
npm run lint
npm run ui:check
npm test
npm run build
```

Latest results after the code changes:

| Command | Result |
|---|---|
| `npx tsc --noEmit` | Passed, exit 0. |
| `npm run lint` | Exit 0; 0 errors and 2,986 warnings. The four React Hooks dependency warnings in the repaired code were cleared. |
| `npm run ui:check` | Passed, 0 errors and 109 warnings, all for hardcoded Arabic accessibility/input attributes. |
| `npm test` | Passed, 23 files and 203 tests. |
| `npm run build` | Passed, client and server bundles. |

The fake checkout journey must not be represented as a successful real order. Test output may include an environment warning for unsupported MapLibre/WebGL usage; the journey test now isolates the picker and its race behavior has a focused component test.

The repository workspace build also passed using `PORT=5173 BASE_PATH=/ pnpm run build`. These environment values satisfy the mockup-sandbox's local build configuration; the command did not start a server.

## Not verified; required before a pilot

### Backend and transaction safety

- The user confirmed the configured remote Supabase target is authorized non-production and scoped role accounts are provisioned. Their login secrets were not present in the execution environment, so authenticated role journeys remain pending.
- Public browser flows against that confirmed test project passed for catalog/product browsing, store search, open-now filtering/empty state, product-to-local-bag, the anonymous checkout login gate, and one 390x844 Arabic RTL viewport. No checkout was submitted and no server write/order was created; details are in `docs/REAL_USER_TEST_REPORT.md`.
- After the product discovery repair, Chromium confirmed `/explore` renders catalog cards and `q=سرير` narrows results to two matching items; `/map` still renders map/place discovery.
- Independently verify canonical schema version, RLS, RPC signatures, inventory locks/reservations, idempotency and error behavior, merchant suborder quoting/approval/cancellation, carrier assignment, status transitions, COD collection and notification/realtime policies.
- Exercise the customer → merchant → customer → delivery (where enabled) → customer tracking workflow with non-monetary test data. Verify each participant sees consistent per-store totals, shipping fees, inventory and status.
- Validate the database's role authorization server-side; never weaken policy to satisfy a UI test.
- Confirm wallet deposits/withdrawals remain unavailable. Do not test real payments, wallet movements or production orders.

### Product and device QA

- Test signup, login/logout, password recovery, product/store search, variants, cart restoration, checkout failure/retry, order history, tracking, favorites and reviews in the authorized test environment.
- Test merchant onboarding, store/product editing, image uploads, inventory, order quote/rejection and fulfillment, permissions and error handling.
- Test carrier onboarding/approval, assigned queue visibility, acceptance/rejection, valid/invalid status transitions and tracking.
- Test Arabic RTL and English LTR (if enabled), light/dark/system appearance, small mobile screens, tablet/desktop, keyboard-only navigation, touch target size, loading/empty/error/success states, slow/offline network, upload failure and realtime reconnection on actual browsers/devices.
- Review text localization, inconsistent hardcoded copy, and the outstanding UI checker warnings before external pilot feedback.
- Review every authenticated shopper, merchant and carrier page at mobile and desktop breakpoints. This change unifies navigation chrome; it is not a full page-by-page visual redesign.
- Decide and document whether an administration application is in scope. No admin route is present in this checkout; do not infer or add administrative capabilities without product/security approval.

## Database / migration status

- **Migrations created for this work:** none.
- **Migrations executed:** none.
- The only available database files are a historical backup under `.migration-backup/supabase/migrations`; there is no canonical `supabase/` directory. Do not use the backup as a deployment plan without checking the authorized non-production canonical schema first.
- Any future required change must be a new ordered migration, include authorization/integrity rationale, verification queries and rollback considerations, and be submitted for human review. Do not apply it without explicit approval.

## Release gate checklist

- [ ] Canonical non-production schema/RLS/RPC review completed by authorized owner.
- [ ] Role-based non-production user journeys pass without fake backend responses.
- [ ] Order, inventory, fees, payment method and participant-visible statuses reconcile across shopper and merchant (and carrier if assigned).
- [ ] Mobile and Arabic RTL/LTR browser checks completed.
- [ ] Wallet remains disabled and no real payment or order was triggered during QA.
- [ ] All release-blocking UI warnings/issues triaged; release owner signs off on accepted warnings.
- [ ] Privacy, support, environment configuration, monitoring/Sentry and rollback/incident procedures reviewed.
- [ ] Product/admin scope and any required migration have explicit owner approval.

Publishing this branch is currently blocked because GitHub CLI is not authenticated in this environment (`gh auth status` reports no logged-in host). No push, merge, migration execution, or deployment has been performed.
