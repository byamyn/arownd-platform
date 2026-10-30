# Arownd — Audit Report (static review only)

## Environment limits
No network and no node_modules in this environment: `npm ci`, `tsc`, `eslint`, `vitest`, `vite build` and Playwright were NOT run. Nothing here is build- or test-verified.

## Fixes applied (all unverified by build/tests — see limits above)
Logic / data
1. checkout double-submit: synchronous `submittingRef` guard (checkout.tsx).
2. Duplicate orders on retry: shipment failure after a successful order RPC no longer throws (sooqy.ts).
3. Order tracking: `rejected` orders were treated as unknown (empty timeline); now shown as cancelled/rejected.
4. OrderStatusBadge crashed on unknown status (`m.cls` of undefined); now falls back safely.
5. Store status "no hours" badge was unstyled (config keys mismatched: bg/dot vs bgClass/dotColor).
6. Home: native `prompt()` for wilaya (accepted any number, unguarded localStorage) replaced by WilayaButton; stored value validated 1..58; localStorage wrapped in try/catch.
7. Orders list: failed fetch showed "no orders yet"; now shows ErrorState with retry.
8. cards: `distance !== undefined` rendered "null km"; now `!= null`.
9. auth: `isRTL` read from `document.dir` (SSR hydration mismatch) now from useTranslation.

i18n / RTL / a11y
- Store open/closed status is now structured (`code` + `params` in geo.ts) and localized in badges.tsx via `localizeStoreStatus`; stock/verified/open badges, km unit, weekday names translated.
- Migrated to dictionaries (ar+en): checkout, favorites, orders list, order tracking, stores index, root 404/error/meta, home/auth/explore SEO heads.
- Physical-direction classes replaced (text-right→text-start, mr→me/ms, right-[15px]→end-[15px]); back arrows flip per direction.
- aria-pressed on filter toggles, role=dialog on the stores filter sheet, aria-label via keys.
- Static check (python): 430 ar keys / 430 en keys, no duplicates, no missing pair, every `t("…")` literal used in the migrated files resolves.

## Beta release notes (round 3)
- English disabled centrally: `ENGLISH_ENABLED = false` in src/lib/i18n.ts. `getSavedLang()` returns Arabic on server render and client (server.ts left untouched; `/en/*` URLs still resolve but render Arabic), hides the language toggle, removes `hreflang=en` / `og:locale:alternate`, and `/en/*` entries were removed from public/sitemap.xml. English dictionaries kept intact; set the flag to true (and regenerate the sitemap) to re-enable.
- BottomNav: `max-w-2el` typo (invalid class, nav had no max width) fixed to `max-w-2xl`.
- Bag/checkout: bottom padding raised to `pb-[calc(11.5rem+env(safe-area-inset-bottom))]` so content no longer hides behind the sticky action bar + nav (checkout used only 8rem).
- Added docs/UI_SYSTEM.md (tokens, RTL rules, state checklist, component map).
- Not done: visual redesign pass; BottomNav uses `flex-row-reverse` under RTL (verify intended item order on device); canonical URLs still say sooqy.app while branding is Arownd (decide domain before production); `viewport-fit=cover`.

## Reviewed, no change needed
- create_order RPC validates auth, empty bag, delivery/payment values, quantity, stock (row lock) and computes prices/totals server-side.
- SEO JSON-LD escapes `<`; error overlay escapes all interpolated text; no secrets found in source (.env.example only).

## Remaining / not done
- ~1000 more hardcoded Arabic lines in other files (about.tsx, merchant studio.*, admin.*, product page, profile, bag, etc.) — continue migration.
- 21 files still use text-left/right or ml/mr; `viewport-fit=cover` is not set while safe-area insets are used (verify on a notched device before changing).
- Shipment creation is not atomic with the order (needs an RPC/migration); no idempotency key on create_order (schema change).
- Premium visual redesign (tokens, spacing, dark/light contrast audit) not done; needs on-device review.
- New tests not written; nothing was compiled or run.

## Run
Node 22.x; `npm ci`, copy `.env.example` to `.env` and fill Supabase values, then `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` (or `npm run build:vercel`).

## Round 4 (UI only, backend untouched)
Applied UI_SYSTEM.md: logical RTL classes (66 lines, Arabic rendering preserved), earlier inverted ms/me/start mappings corrected, icon-button aria-label, tab semantics, 44px touch targets, off-brand accent colour removed. Backend files (supabase/, api/, scripts/, vercel.json, package.json, src/server.ts) are byte-identical to the uploaded original; the only non-UI code changes in the whole project are src/lib/sooqy.ts (shipment-failure fix) and src/lib/geo.ts (structured store status), from rounds 1-2. Bracket-balance check vs the original: no new imbalance. Still unverified: tsc, lint, tests, build.

## Round 5 (brand unification + launch readiness)
- Brand spelled `Arownd` everywhere user-visible (137 lines / 32 files incl. capacitor appName, android strings); code identifiers, storage keys and map-style names intentionally unchanged. Footers use the official tagline. Two tests updated for the new spelling.
- Added docs/LAUNCH_1000_USERS.md (verified vs unverified, risks, staged rollout). Capacity for 1000 users is NOT proven: needs tsc/lint/test/build, a load test, and checking Supabase/Vercel plan limits.
- Backend (supabase/, api/, scripts/, vercel.json, package.json, src/server.ts) still identical to the uploaded original.

## Round 6 (Hybrid Premium)
- scripts/ui-lint.mjs (+ `npm run ui:check` in package.json): enforceable UI rules; currently 0 errors, 185 warnings (170 hardcoded Arabic attrs, 13 img lazy, 2 autocomplete). Executed with node here.
- Removed native `confirm()` in delivery-dashboard (ConfirmDialog); ConfirmDialog default labels + primary-tone contrast fixed (white text on lime).
- Hybrid Premium tokens/utilities (motion tokens, card-premium, tag-smart) and smart tags (best price / nearest / savings) on product offers; keys added ar+en.
- package.json changed only by adding the `ui:check` script. Still unverified: tsc, lint, tests, build, visual review on device.

## Round 7 (features actually work — static audit)
Checked by script: all literal `to="/..."` link targets resolve to existing route files (31 routes); no buttons without handlers, no empty onClick, no `href="#"`; no mock/TODO placeholders.
Fixed:
1. Product page "Buy now": `buyNow()` existed and the key `product_buy_now` existed but NO button called it (dead feature). Wired as primary action; add-to-bag and reserve became 44px icon buttons with aria-labels. Buy now no longer stacks quantity on top of an existing bag line.
2. Bag provider: corrupt/foreign localStorage data could produce NaN counts or crash rendering → `sanitizeBagItems` (drops bad items, clamps qty 1..10, merges duplicates; unit test src/test/bag-sanitize.test.ts); stale-closure lost updates on rapid add/setQty/remove → latest-value ref; cross-tab `storage` events for unrelated keys no longer trigger re-reads; add() clamps invalid quantity.
3. Share link: unguarded `navigator.clipboard.writeText` now handled with an error toast instead of an unhandled rejection / false success.
4. Checkout offers query keyed by offer ids (not whole items) — no refetch on unrelated item changes.
Known limitation (not changed): bag lines are keyed by offerId only, so adding the same offer with a different size/colour overwrites the previous options instead of creating a second line (needs a bag identity change + server contract review).
Still unverified: tsc, lint, vitest (incl. new test), build, device/visual checks.

## Round 8 (interaction patterns + merchant studio)
- New `SideSheet` (src/components/sooqy/side-sheet.tsx, Radix Dialog): bottom sheet on mobile, side panel on md+, focus trap, Esc, sticky footer, RTL-aware slide animation (styles.css `animate-sheet`).
- Merchant studio: product edit form and image management moved out of the inline list into SideSheets (save button in footer); unsaved-changes guard via ConfirmDialog. Save/upload logic untouched. Unused `X` import removed.
- Stores filters panel migrated to SideSheet (was hand-rolled overlay).
- docs/UI_SYSTEM.md §9 documents the pattern. Keys added ar+en (studio_*).
- NOT done: merchant order detail as side panel, inline stock stepper, KPI/low-stock alerts, studio.index.tsx split (1300-line component), Arabic hardcoded text in studio (~hundreds of lines). Nothing compiled or run here; the "better than global apps" claim is not something I can substantiate.

## Round 9 (merchant studio "quick management")
- FIXED A BUG I INTRODUCED IN ROUND 8: `useState(confirmDiscard)` in studio.index.tsx had been placed after the component's early returns (Rules of Hooks violation → "rendered more hooks" crash when the page moved from loading to ready). Moved above the early returns; a script scan of all components found no other hooks after early returns.
- New `StudioProductRow` + product search/filter chips (all/low/out with counts) + inline stock stepper + visibility switch + low-stock alert banner. Failures show toasts (previously `merchantToggleAvailability` rejection was unhandled). Uses existing `merchantUpdateOffer` / `merchantToggleAvailability` — backend untouched. Removed now-unused imports (Image, Pencil, Trash2, ToggleLeft, ToggleRight, primaryImage).
- Existing tests do not reference the old row labels (checked journey/app-routing/merchant-upgrade selectors).
- All rounds 7-9 changes are statically checked only (bracket balance, ui:check = 0 errors, i18n parity 468/468). Please rerun: npm test, tsc, lint, build.

## Round 10 (page experience rebuild — Home, Profile, Settings, Stores, Navigation)
Real defects found and fixed
- Store cards (stores list + favorites) were NOT links (a 24px logo + name in a plain div) — tapping a store did nothing. `StoreCard` rebuilt as a real link card (logo, name, verified, commune, open-status, rating, distance); new `StoreRailCard` for rails.
- Settings "Delete account" only called `signOut()` and toasted "account deleted" (false success). Now an honest "request account deletion" that opens a pre-filled email to the support address already published in the privacy policy; no false success, no sign-out.
- Settings "Security" and "My addresses" were "coming soon" placeholders. Security now really changes the password (`auth.updateUser`, validation: ≥8 chars + confirmation) in a SideSheet; "addresses" row now points to the real wilaya/commune settings in the profile.
- Back buttons across 9 pages used `history.back()` only → dead button on direct links (shared product, notification → order). New `goBackOrTo(router, fallback)` (src/lib/nav.ts, unit test added).
- Profile: edit form was appended at the very bottom of the page (below support links); moved into a SideSheet with label/`id` association and autocomplete attributes; leaked blob URL for avatar preview now revoked.
Redesigned presentation
- Home: hero with headline + prominent search (navigates to /explore?q=), category chips, nearby-stores rail (by geolocation, else rating), section headers with "see all".
- Profile: identity card (cover band, overlapping avatar, contact/status chips) + 3 tap tiles (orders, favourites, wallet with counts).
- Settings: premium account card, 44px actions, theme "system" icon fixed.
Not redone in this pass (still the previous layout): Explore, Product page layout (only back fix; earlier rounds added Buy now + smart tags), Checkout visuals, Store page (visitor view), Studio settings/shipments/orders pages, Admin, Wallet, Notifications.
Test impact reviewed: journey tests assert "وصل حديثًا" on /, the profile edit button name /تعديل/ + "تعديل الملف الشخصي" + placeholders + "حفظ التغييرات", and "/settings" → "الإعدادات" — all preserved. Nothing was compiled/run here; please rerun tsc, lint, vitest, build.

## Round 11 (store page, product contacts, bag)
Defects fixed
- WhatsApp links (store page ×2, product offers) used the raw local number: `wa.me/0550…` opens a wrong/empty chat, and stores without a number rendered dead buttons (`wa.me/`, `tel:`). New `src/lib/contact.ts` (`whatsappUrl`, `telUrl`, international normalization for 0…/+213…/00213…) + `src/test/contact.test.ts`; contact buttons render only when the channel exists. Fixed a double-encoding hazard (waText was pre-encoded).
- Store page: network failure was shown as "store not found" and its retry button went *back*; now `isError` → ErrorState with real refetch, genuinely missing → empty state + "browse stores". Share now falls back to copying the link (desktop) and only reports real failures (AbortError ignored). Distance showed a bare number — now `formatKm`. Tabs got `role=tab`/`aria-selected`; product tiles use `card-premium`.
- Bag: stepper allowed up to stock (e.g. 25) while the bag clamps at 10 → "+" appeared broken; max is now min(10, stock). Saved wilaya validated (1..58). Removing an item now offers an Undo toast.
Still not redesigned: Explore, Category, Checkout visuals, Orders list/detail visuals, Notifications, Wallet UI, Map, Auth, Studio settings/shipments/orders, Admin, Create-store, Delivery register/dashboard, About/Help/Privacy/Terms. `/mobile` and `/diagnostics` are separate Vite entries (entry-mobile.html, diagnostics.html), not router routes.
Unverified: tsc, lint, vitest (new tests contact/nav/bag-sanitize), build.

## Round 12 (explore, category, notifications, onboarding, merchant pages)
Critical logic defects fixed
- **Merchant Shipments page never worked**: store id was read from `user.user_metadata.store_id`, which no code ever sets → permanent "no store linked". Same root cause in the merchant order page (`fetchStoreOrderItems(undefined)`). Both now use the real store (`fetchMyStore`). Shipments are fetched once and filtered locally, so the status-count tiles no longer show 0 for other statuses while a filter is active; error state now has retry. Order-page cache key aligned with the dashboard's (`["store-orders", storeId]`).
- **Notifications**: the options button was `opacity-0 group-hover:opacity-100` inside a parent without `group` → permanently invisible, so delete / mark-read were unreachable except by right-click. Actions are now visible (44px) and the row is keyboard-accessible. Wrong navigation fixed: reservation notifications opened `/orders/<reservationId>` (reservations aren't orders) and offer notifications passed an offer id as a product id. Removed the debug JSON dump shown to users; mark-read/mark-all now handle failures; added error state; Arabic SEO description.
- **Explore**: search only ran on Enter although a debounce helper existed unused → now debounced (400ms) and Enter commits trimmed text; feed lost the user's position after visiting a product → position restored (same filters only, StrictMode-safe); changing sort/price/category left a stale card index → resets; NaN price bounds sanitized; visual-search failures were swallowed → toast.
- **Category**: failed load was shown as "no products" → ErrorState with retry; count showed only loaded items ("20") → "20+" while more pages exist; added "nearest" sort when location is known.
- **Create store**: a user who already has a store could create another → redirected to /studio; login link now returns to /create-store. **Settings** shows "Merchant studio" for merchants instead of "Become a merchant".
- **Delivery register**: phone validation (mobile or landline, 9–10 digits starting with 0), normalized before saving; field labels/autocomplete.
- **Auth**: `redirect` param also rejects backslashes; offline no longer reports "invalid credentials".
UX additions: Explore card/grid view toggle (persisted), active-filter chips, position indicator; filter panels in Explore/Category use SideSheet; category/other-category chips use card-premium.
Still not redone (visual): Checkout, Orders list/detail visuals, Wallet UI, Map, Studio settings, Admin pages, About/Help/Privacy/Terms. `/mobile` and `/diagnostics` are separate Vite entries.
Unverified (not run here): tsc, lint, vitest, build; all new tests (contact, nav, bag-sanitize).
