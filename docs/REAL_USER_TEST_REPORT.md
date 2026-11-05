# Arownd — Real-user QA report

**Run date:** 2026-11-05
**Decision:** Public browse/search checks against the owner-confirmed non-production backend passed, and the broken product discovery route was repaired and retested. Authenticated cross-role E2E is still blocked.

## Safety and test environment

- The process environment contains a remote `SUPABASE_URL` and publishable key. The user explicitly confirmed that this configured target is an authorized non-production project and that role-specific test accounts are provisioned. The local Vite app was launched against that confirmed test project for public, read-oriented browser flows.
- No test-account login secrets or authenticated browser sessions were available in the execution environment. Authenticated shopper, merchant, and carrier flows therefore remain blocked. Never send passwords, tokens, or service credentials through chat.
- Chromium was driven through its DevTools protocol for a temporary local session. Browsing/search reads were made against the owner-confirmed test project. The run did not log in, submit checkout, create an order, change a server record, or perform a payment or wallet action.
- Vitest journeys use `src/test/supabase-fake.ts`; they simulate interactions and fake RPC/database results. They are not real authentication, persistence, inventory reservation, shipment processing, or cross-role E2E proof.
- No production endpoint, wallet operation, migration, or database setting was used or changed.

## Journeys exercised locally

| Role / flow | Steps exercised | Expected | Actual result | Evidence / limits |
|---|---|---|---|---|
| Shopper — browse product and bag | Open product; add item; open bag; increase quantity; remove item | Product appears, quantity/total update, bag becomes empty | Passed in simulated UI | `src/test/journey.test.tsx`; fake data and local state only |
| Shopper — checkout | Review two option variants of one offer; enter address, wilaya, phone and delivery address; submit COD checkout | Both variants stay distinct; a single order RPC is invoked; success UI and tracking code appear; bag clears | Passed against fake RPC | Does not establish server persistence, order validity, fee calculation, stock reservation, or real shipment creation |
| Shopper — favorites | Favorite a store; open favorites and stores tab | Store is favorited and appears in favorites | Passed using local storage | No cross-device or server synchronization tested |
| Shopper — review | Select four stars and submit a review | Confirmation appears and review is recorded | Passed against fake RPC | No real authorization, persistence, duplicate-review, or moderation check |
| Shopper — profile | Open profile and edit form | Profile page and expected edit controls render | Passed for rendering | Save/edit mutation was not submitted |
| Shopper — registration/login/recovery | No real account flow executed | Account creation, login and recovery succeed only after server confirmation | Not tested | Requires isolated project and dedicated credentials |
| Merchant — store onboarding | Enter store details/category and open store | Store RPC succeeds and merchant dashboard reflects the store | Passed against fake RPC | No server-side role/RLS or durable data verification |
| Merchant — store settings | Open settings from merchant dashboard | Settings route opens with store identity form | Passed for navigation/rendering | No actual save, image upload or persisted update tested |
| Merchant — catalog/inventory/orders | Add/edit/delete products; alter prices/stock; receive and process an order | Mutations persist and reconcile with shopper order | Not tested | No backend-bound merchant journey or test merchant data |
| Carrier — dashboard | Render unregistered dashboard; render approved carrier with pending shipment | Registration link is shown when no company exists; approved carrier sees pending queue | Passed for rendering/query selection using fake data | No application submission, approval, task acceptance, status transition, permission denial or tracking synchronization tested |
| Customer–merchant–carrier integration | Complete a real purchase and verify each role's record/state | All participants see consistent order, totals, stock and shipment status | Not tested | Requires a shared non-production backend and accounts for all roles |
| Administration | Inspect currently available route behavior | Only authorized existing administrative functions are tested | Not tested; no admin route is present in this checkout | Product owner must confirm intended scope; no administrative capability was inferred |
| Wallet safety | Open wallet preview and inspect deposit/withdraw controls | Deposit and withdrawal remain unavailable; no transaction mutation occurs | Passed in fake-backed UI test | No wallet endpoint was contacted |

The route smoke tests rendered configured app routes in Vitest, but a rendered page is not evidence that every button, filter, form, or backend workflow works. Notifications/realtime, real shipment tracking, and broad browser/device coverage remain unverified.

## Real browser checks against confirmed non-production data

| Flow | Steps exercised | Observed result | Boundary |
|---|---|---|---|
| Storefront browse | Opened the local app in Chromium at Arabic locale; browsed home and product detail | Home rendered live catalog cards. Product “سرير موديل لوكس” rendered as available at 1,000 DZD, with color text and store/delivery details | Read-only catalog. No inventory mutation |
| Store search | Opened `/stores`; typed `Meuble` in the store search | The list narrowed from 3 stores to 1 (`Meuble de Lux`) | Read-only query/filter |
| Open-now filter and empty state | Enabled “مفتوح الآن” when all currently visible stores were closed | `aria-pressed` became true; result count became 0 and the empty state appeared | No defect observed; result was consistent with displayed closed status |
| Product → bag → checkout gate | Clicked “اشترِ الآن”; inspected checkout, then bag | Product was added to the isolated browser's local bag; `/checkout` correctly required login. Bag showed one item, subtotal/total 1,000 DZD, and delivery fee pending wilaya selection | Checkout was not submitted; no order RPC or server-side order was created |
| Mobile / RTL layout | Set Chromium viewport to 390×844 on `/stores` | Arabic `dir=rtl`; document width was 390 px with no horizontal overflow | One route/viewport only; not full device/browser coverage |
| Explore before repair | Opened `/explore` and searched for a product | Route rendered the store map and searched places, despite product-discovery links and translations targeting that route | Defect reproduced; no product discovery/results on route |
| Public route smoke | Opened `/stores`, `/favorites`, `/about`, `/help`, `/privacy`, `/terms`, `/explore`, `/map`, `/auth`, `/orders`, `/profile`, and `/bag` in Chromium | Pages rendered without uncaught browser exceptions; unauthenticated orders/profile showed sign-in gates | Render smoke only; not every control or server interaction |
| Protected-route smoke | Opened `/checkout`, `/studio`, `/studio/add-product`, `/delivery-dashboard`, and `/wallet` signed out | Each route displayed a sign-in gate rather than exposing role data or allowing checkout | No authenticated role behavior tested |
| Direct `/contact` route | Navigated to `/contact` directly | App displayed 404 | No `/contact` route file or internal `/contact` link was found; support content is at `/help`. Reported as an unregistered direct URL, not a broken in-app link |

| Explore after repair | Opened `/explore`, then searched `سرير` | Product cards rendered from the catalog; query narrowed to two matching beds and updated URL to `/explore?q=...` | Public read-only search against confirmed non-production data |
| Map after route split | Opened `/map` | Interactive map and place search remained available separately | No map search mutation |
| Shared navigation responsive smoke | Captured public discovery at 1440×900 and 390×844 after unifying the nav frame | Shopper navigation stayed visible, centered, and usable without obscuring page content at both sizes | Authenticated merchant rendering not available; the merchant component shares the same styles but is not claimed as browser-verified |

Store search remains at `/stores`; `/explore` is now explicitly product discovery/search, while `/map` is the store/place map.

## Findings and repairs

The shopper and merchant navigation bars previously used separate surface colors, spacing and active states, and the merchant bar disappeared on desktop. Both now use the same token-based, safe-area-aware navigation frame and active treatment at every width; destination sets and role logic remain unchanged. This implementation-level consistency has not yet been visually reviewed in authenticated merchant sessions, and does not claim that every route has been redesigned.

The shared `AppShell` now supports a wide workspace frame and is applied to the merchant dashboard, delivery dashboard, and customer orders page. This standardizes their gutters, maximum width, canvas, and reserved navigation space without changing route behavior. Delivery shipment status badges now use available semantic theme tokens rather than undefined color names. The authenticated dashboard pages still require visual review with role accounts.

The same frame is also used by merchant product creation, store settings and merchant order details. Shared `PageHeader` now aligns to the frame's gutter and uses one translucent sticky surface, reducing the header/content edge mismatch across routes.

The reproduced product-discovery route mismatch was fixed: `/explore` was wired to the map component although home CTAs, discovery translations, and product-search API were for product browsing. It now renders a paginated product grid with debounced URL-backed search, category links, sorting, in-stock filtering, loading/error/empty states, and a bag shortcut; `/map` retains the map experience. Arabic and English search/count copy was corrected. A focused Vitest journey confirms the page renders catalog data and sends the entered query to the product-offer search.

The local regression suite also retains coverage for previously discovered client-side defects:

- Approved carrier pending-queue gating was corrected so approved companies can query pending shipments.
- Checkout rows now have per-variant identity and display the selected options.
- Store location selection no longer reverts when map loading completes after a newer selection.
- React effect dependencies/cleanup for push registration, location selection, category pagination, and map markers were corrected.
- The UI-check scanner no longer mistakes `>` in JSX arrow callbacks for an input tag boundary; the support phone/email inputs have autocomplete metadata and phone input mode.
- Relevant remote images use lazy loading/async decoding; local merchant image previews use low fetch priority.

These are code-level repairs with local regression coverage, not confirmation of server-side correctness. No database defect or migration requirement was demonstrated by the current QA run.

## Validation results

Run from `repository root`, in the requested order:

| Command | Result |
|---|---|
| `npx tsc --noEmit` | Passed, exit 0. |
| `npm run lint` | Exit 0; 0 errors and 2,986 warnings. |
| `npm run ui:check` | Passed, 0 errors and 109 hardcoded Arabic accessibility/input text warnings. |
| `npm test -- --reporter=dot` | Passed, 23 files and 203 tests. Journey assertions use the local Supabase fake. Product search also verifies URL query synchronization. |
| `npm run build` | Passed; client and server bundles built. |

No test failure occurred. The successful local checks do not clear the live E2E blockers below.

## Files changed in this QA continuation

- `docs/REAL_USER_TEST_REPORT.md` — records test provenance, simulated journeys, outcomes, untested flows, and release blockers.
- `src/styles.css`, `src/components/sooqy/BottomNav.tsx`, and `StudioNav.tsx` — align shopper and merchant navigation surface, active-state, focus, and safe-area styling across viewport sizes.
- `src/components/sooqy/app-shell.tsx` and `src/routes/studio.index.tsx`, `delivery-dashboard.tsx`, and `orders.index.tsx` — standardize content framing for core customer and operations dashboards.
- `src/components/sooqy/page-header.tsx`, `src/routes/studio.add-product.tsx`, `studio.settings.tsx`, and `studio.orders.$orderId.tsx` — standardize shared page headers and merchant content framing.
- `src/routes/explore.tsx` — replace the misplaced map screen with product discovery/search; map remains under `/map`.
- `src/lib/dictionaries/explore.ts` — clarify product-only search copy, localize category names, and add localized result count.
- `src/test/journey.test.tsx` — assert the discovery route queries products and synchronizes the entered term with the URL.

The earlier browser QA run made no application-code, database, or migration changes; the subsequent discovery-route repair and its test are documented above. No database or migration changes were made.

## Blockers before release

1. Make the provisioned test identities available to the execution environment through an approved secret mechanism; none were exposed to this session. Do not send passwords, API keys, or service credentials in chat.
2. Run authenticated browser workflows against the confirmed test project: signup/login/recovery; checkout errors/retry/persistence; merchant product/order operations; carrier assignment and authorized status transitions; and cross-role tracking/notifications.
3. Determine whether product search should also include store-name search; current product search indexes product name/brand, while store search remains on `/stores`.
4. Verify current canonical schema, RPC, and RLS behavior against the authorized test project without weakening policies. No canonical `supabase/` directory was available in this checkout; historical migration backups are not authoritative.
5. Test Arabic RTL and mobile/tablet/desktop behavior on real browser viewports/devices. Resolve or formally accept the remaining UI and lint warnings.
6. Confirm admin scope with the product/security owner; no admin route was found in the app.

**Migration status:** none created or executed.
**Production access or transactions:** none.
**Test-project access:** public browse/search reads only.
**Release assessment:** not proven ready for pilot; real backend and device E2E sign-off remains outstanding.
