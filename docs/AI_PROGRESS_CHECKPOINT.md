# Arownd repair and release-candidate checkpoint

## Completed

- Unified shopper and merchant navigation under the same token-based bottom-navigation frame, active-state treatment, touch target and safe-area handling. Merchant destinations remain distinct, but the bar now also appears on desktop instead of disappearing at the tablet breakpoint. No role, route or authorization behavior changed.
- Added shared `app-bottom-nav*` design utilities and applied them to customer and merchant navigation components.
- Standardized the content frame on the merchant studio, delivery dashboard, and customer orders page through the shared `AppShell`, including one responsive wide-workspace width and bottom-navigation clearance. Replaced delivery shipment status colors that had no corresponding design tokens with the existing semantic warning/info/primary/success/danger palette.
- Reused the shared `AppShell` on merchant product creation, store settings and order details, and standardized shared page headers with consistent full-gutter alignment and a subtle translucent sticky surface.
- Fixed delivery dashboard query gating. The pending-shipments query was enabled only for unapproved companies, even though the page returns an approval-pending state for those companies. Approved carriers therefore saw no pending shipments. It now loads the pending queue only for an approved company. The UI journey test verifies an assigned pending shipment appears for an approved carrier.
- Fixed checkout variant review. Rows previously used only `offerId` as their React key, so different variants of one offer had duplicate keys, and selected options were omitted from the final review. Rows now use the stable offer-plus-options bag key and render selected options. The checkout journey test verifies two variants remain visible independently.
- Fixed a stale-location race in the store map picker. If the selected location changed before MapLibre emitted `load`, its callback could replace the latest marker with the initial coordinates. It now reads the latest location from a ref; a component regression test covers a selection change before map load.
- Resolved four actual React Hooks lint warnings: push registration now keys its effect guard to the user ID; map-picker callbacks read the current selection; category pagination tracks its current fetch function; and map cleanup captures the marker collection belonging to that effect.
- Fixed the UI-check input tag scan: its regex stopped at the `>` in inline JSX arrow callbacks, incorrectly flagging fields that already had autocomplete attributes. The scan now masks arrows before parsing tags and checks telephone `inputMode`; the support form's phone and email fields now declare appropriate autocomplete values and phone input mode.
- Added lazy loading and asynchronous decoding to below-the-fold/delayed remote images in checkout, product zoom, profile, store, and merchant dashboard views. Merchant-settings previews retain immediate loading for newly selected local images, with low fetch priority. UI-check warnings dropped from 120 to 109; remaining warnings are Arabic accessibility/input attributes that should be translated deliberately.
- Performed public-flow browser QA in headless Chromium after the user confirmed the configured remote Supabase target is authorized non-production and role test accounts are provisioned. The live test-project reads verified Arabic RTL storefront/product rendering, store search (`Meuble` narrowed 3 stores to 1), open-now filter/empty state, product-to-local-bag and anonymous checkout login gate, and a 390x844 store-list viewport without horizontal overflow. Checkout was not submitted; no server write or order was created.
- Extended Chromium smoke coverage to public/support/legal/favorites routes and signed-out checkout, merchant, carrier, orders/profile, and wallet gates. Those pages rendered without uncaught browser exceptions. A direct `/contact` URL returns 404, but no internal `/contact` link exists and support is provided at `/help`; documented as an unregistered URL rather than a broken in-app link.
- Fixed reproduced product-discovery routing defect: `/explore` rendered the map/place search even though the homepage links, dictionary, and API implied product discovery. `/explore` now provides URL-backed debounced product search, categories, sort/in-stock filters, pagination, and loading/error/empty states; the map stays available at `/map`. The browser confirmed a search for `سرير` returns two matching catalog cards from the confirmed test project.
- Localized the ten main category names on `/explore` in Arabic and English, and clarified its description as local product discovery.
- Added a Vitest journey for product discovery, catalog query behavior, and query-string synchronization. Test suite passes 23 files / 203 tests.
- Recorded test provenance, discovered defect, fix, browser evidence and limitations in `docs/REAL_USER_TEST_REPORT.md`. Authenticated test-role secrets remain unavailable in the execution environment, so account, merchant, carrier, and cross-role workflows remain pending.
- Preserved the pre-existing worktree edits to the root layout, wallet, and journey tests. No wallet deposit or withdrawal action was enabled by this work.
- Added `docs/ARCHITECTURE.md` with the route/component/domain/backend map, role-by-role evidence, design/navigation/i18n structure, trust boundaries, and unverified areas.
- Added `docs/RELEASE.md` with the release decision, reproducible verification, migration status, and explicit pilot-release gates.

## Files changed for this repair

- `src/styles.css` — shared navigation frame, translucent surface, focus, active-state and safe-area design utilities.
- `src/components/sooqy/BottomNav.tsx` and `StudioNav.tsx` — align shopper and merchant navigation presentation while preserving role destinations.
- `src/components/sooqy/app-shell.tsx` — add a typed wide-workspace layout option to the shared page shell.
- `src/components/sooqy/page-header.tsx` — align shared sticky headers to the page gutters and unify their surface.
- `src/routes/studio.index.tsx`, `studio.add-product.tsx`, `studio.settings.tsx`, `studio.orders.$orderId.tsx`, `delivery-dashboard.tsx`, and `orders.index.tsx` — apply consistent content frames; use semantic status colors on delivery shipment labels.
- `src/routes/delivery-dashboard.tsx` — gate the pending queue on carrier approval.
- `src/routes/checkout.tsx` — stable per-variant React identity and visible variant values.
- `src/components/NativePushNotifications.tsx` — use the current user ID as the push-registration effect identity.
- `src/components/sooqy/StoreLocationPicker.tsx` — prevent stale map-load callbacks from reverting the selected location.
- `src/components/sooqy/StoreLocationPicker.test.tsx` — regression test for a selection changed before map load.
- `src/components/sooqy/StoreMap.tsx` — capture effect-owned markers for cleanup.
- `src/routes/category.$catId.tsx` — keep infinite-scroll callback dependencies current.
- `scripts/ui-lint.mjs` — avoid false-positive input attribute warnings from JSX arrow callbacks and detect missing telephone input mode.
- `src/routes/help.tsx` — add phone and email autofill metadata to the support form.
- `src/routes/profile.tsx`, `src/routes/stores.$storeId.tsx`, `src/routes/studio.index.tsx`, and `src/routes/studio.settings.tsx` — use suitable image loading/priority hints.
- `src/routes/products.$productId.tsx` — defer the product image zoom until opened and decode asynchronously.
- `docs/REAL_USER_TEST_REPORT.md` — record public real-browser outcomes against confirmed non-production data and distinguish them from fake-backed Vitest journeys.
- `src/test/supabase-fake.ts` — add local carrier and shipment fixtures for UI journey coverage.
- `src/test/journey.test.tsx` — cover approved-carrier queue rendering and variant visibility in checkout; isolate the WebGL picker in jsdom because its behavior has a dedicated component test. This file also contains pre-existing user changes.
- `docs/ARCHITECTURE.md` — current architecture and product-state map.
- `docs/RELEASE.md` — release readiness and pilot gates.
- `docs/AI_PROGRESS_CHECKPOINT.md` — record findings, verification scope, and blockers.

Pre-existing user edits preserved: `src/routes/__root.tsx` and `src/routes/wallet.tsx`, plus earlier edits within `src/test/journey.test.tsx`.

## Database and authorization review

- No database change is required for these client-side fixes; no migration was created.
- Reviewed the available historical schema snapshot under `.migration-backup/supabase/migrations`, including checkout idempotency, merchant-managed delivery/COD, atomic shipment status updates, and shipment write restrictions. The canonical `supabase/` directory is absent from this worktree, so this snapshot cannot be treated as proof of the current deployed schema.
- No migration, RLS policy, RPC, database setting, production Supabase project, order, payment, or wallet operation was modified or invoked.
- Database permissions, current RPC definitions, cross-party synchronization, and shipment status transitions remain unverified against an authorized non-production database. No migration is prepared or awaiting execution for these repairs.

## Verification completed

- App route smoke coverage renders customer, merchant, and delivery routes using the local Supabase fake.
- UI journeys cover adding a product to the bag, cart quantity/removal, favorite-store flow, mock checkout RPC confirmation, merchant store creation, merchant settings navigation, approved-carrier pending shipment visibility, and wallet controls remaining disabled.
- `evaluateBag()` is used by both bag and checkout as the shared availability and current-price evaluator. `pickBestOffer()` remains the shared marketplace offer selector.
- Full journey coverage does not contact a live backend. The mock checkout success does not prove a real order was persisted.
- Final validation after the layout changes: `npx tsc --noEmit` passed; `npm run lint` exited 0 with 2,986 warnings and 0 errors; `npm run ui:check` passed with 109 warnings and 0 errors; `npm test -- --reporter=dot` passed 23 files / 203 tests; `npm run build` passed for client and server bundles; `git diff --check` passed.
- Chromium responsive smoke review after navigation unification rendered the public discovery page at 1440×900 and 390×844; the shared nav remained visible, contained, and usable at both widths. An authenticated merchant session was unavailable, so its live navigation rendering was not directly exercised.
- The full workspace build/typecheck also passed with `PORT=5173 BASE_PATH=/ pnpm run build`; this only supplied the mockup-sandbox's required local build settings and did not start a server.
- The four React Hooks dependency warnings are resolved; targeted ESLint confirms zero `react-hooks/exhaustive-deps` warnings in the four fixed paths.
- Journey tests use the fake Supabase client and do not contact a backend. The test-only StoreLocationPicker stub avoids jsdom's unsupported WebGL; the picker itself has a dedicated regression test.
- `git diff --check` — passed; all prior user changes remain present.

## Pending / blocked

- Real registration/login, product-wide search, checkout persistence, inventory reservation, merchant order processing, delivery status authorization, notifications, and customer/merchant/carrier synchronization remain unverified. The user confirmed the configured target is non-production and role accounts are provisioned, but login secrets were not present in the execution environment. No authenticated journey or real order was run.
- Browser verification is limited to Chromium against public flows and a single 390x844 viewport. Broader mobile/tablet/desktop, keyboard, dark-mode, network-failure, and real-device RTL checks remain pending.
- The repository-wide lint command passes but reports 2,986 warnings (0 errors); UI checks pass with 109 warnings for hardcoded Arabic accessibility/input attributes. A broad formatter or automated translation rewrite was not applied.
- Product and feature completeness is mapped in `docs/ARCHITECTURE.md`; its status labels distinguish code/UI present from workflows actually verified. The admin interface is absent from route source and its intended scope is an owner decision.
- Release-candidate readiness is blocked on live non-production workflow verification and review of the canonical database schema/RLS/RPC state.

## Test instructions

From `artifacts/arownd`, run:

```sh
npx tsc --noEmit
npm run lint
npm run ui:check
npm test
npm run build
```

The carrier and checkout regression assertions are in `src/test/journey.test.tsx`; run the Vitest suite with the command above. Do not point local tests at production Supabase.
