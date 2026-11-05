# Arownd architecture and product map

## Scope and evidence

This map describes the checked-in application under `artifacts/arownd`. It is based on the current source, package scripts, local tests, and the historical Supabase migration snapshot under `.migration-backup/supabase/migrations`. There is no canonical top-level `supabase/` directory in this checkout. The snapshot cannot establish which schema, RLS policies, functions, or settings are deployed now.

## Runtime and core technologies

- React 19 and TypeScript with Vite 8.
- TanStack Start/Router for route generation, navigation, SSR, and client hydration.
- TanStack Query for asynchronous data and invalidation.
- Supabase JS for auth, Postgres/PostgREST, RPC, realtime, and storage.
- Tailwind CSS 4 and Radix UI; shared primitives live in `src/components/ui`.
- Vitest, Testing Library, and jsdom for unit and UI journey coverage.
- Sentry initialization in `src/utils/sentry.ts`; native integrations are guarded through Capacitor.
- No framework or package substitution is proposed.

## Application layers

| Layer | Location | Responsibility |
|---|---|---|
| Route and page composition | `src/routes`, `src/routeTree.gen.ts` | Customer discovery, product, bag, checkout, orders, merchant studio, delivery, profile/settings, and static content. Route tree is generated; edit route source, not generated output. |
| Shared product UI | `src/components/sooqy` | App shell, navigation, cards, maps, feedback states, uploaders, tracking, selectors, and mobile interactions. |
| Primitive UI | `src/components/ui` | Radix-based controls and accessible primitive wrappers. |
| Commerce/domain logic | `src/lib/sooqy.ts`, `bag.tsx`, `bag-check.ts`, `delivery.ts`, `shipping.ts` | Typed data access and reusable product/cart/order/delivery operations. `pickBestOffer()` is the shared offer selector; `evaluateBag()` is the shared current-price/stock evaluator used by bag and checkout. |
| Cross-cutting state | `src/lib/auth.tsx`, `i18n.ts`, `theme.tsx`, `geo.ts`, `favorites.ts`, `conn.ts` | Session, locale, theme, location, favorites, and connectivity. |
| Backend adapter | `src/integrations/supabase` | Supabase client, auth storage, and generated database typings. Client calls must not be treated as authorization; secure enforcement belongs in reviewed server/database policies and RPCs. |
| Styles | `src/styles.css`, `src/styles/theme.css` | Tailwind entry and Arownd design tokens/component classes. |
| Tests | `src/**/*.test.*`, `src/test` | Domain tests and UI journeys. `src/test/supabase-fake.ts` is test-only; never use its fixtures as production fallbacks. |

## Navigation, language, theme, and visual system

- `__root.tsx` provides the app shell, providers, error handling, head metadata, service/native integrations, and responsive viewport.
- `BottomNav`, `AccountBottomNav`, and `StudioNav` are role/context-aware variants. Shopper and merchant destinations remain role-specific, while the shared `app-bottom-nav*` utilities enforce one surface, active state, focus treatment, touch target and safe-area layout across mobile and desktop. Keep destinations and labels role-appropriate; do not fork the visual shell.
- `AppShell` is the shared page frame. Use its standard content width for shopper/account pages and its `width="wide"` workspace frame for data-dense merchant and delivery dashboards; both share gutters, canvas and bottom-navigation clearance.
- `PageHeader` is the shared sticky route header; it uses the same page gutter, translucent surface, border and focus-safe controls across feature areas.
- `src/styles/theme.css` defines semantic CSS custom properties, typography, spacing, radii, touch targets, feedback colors, and light/dark palettes. Existing UI wrappers and shared components use these tokens. A remaining concern is uneven adoption: many route components still have route-local markup/classes and hardcoded Arabic copy.
- `src/lib/i18n.ts` and `src/lib/dictionaries` provide the translation layer. Arabic is the default market language, with RTL direction set at the root; English availability is gated by `ENGLISH_ENABLED`. Run `i18n-parity` and locale tests when changing dictionaries or language behavior.
- `ThemeProvider` supports system, light, and dark modes and preserves the legacy SooQy storage key.
- Tailwind logical utilities (`start`/`end`, `ms`/`me`) are preferred for RTL. Phone numbers, map coordinates, and other inherently directional values should explicitly set their direction.

## Product and role map

| Role / area | Source entry points | Current implementation evidence | Release status |
|---|---|---|---|
| Shopper discovery | `index.tsx`, `explore.tsx`, `category.$catId.tsx`, `stores.index.tsx`, `stores.$storeId.tsx`, `map.tsx`, `latest.tsx` | `/explore` is the paginated, searchable product catalog; `/stores` searches stores; `/map` is the map/place discovery view. Uses `searchProducts`, variant-aware product cards, URL-backed search, sort and stock filters. | Product search now has Vitest and read-only non-production browser coverage; ranking, relevance, full store-name search, and live performance require further validation. |
| Product and pricing | `products.$productId.tsx`, `lib/sooqy.ts`, `lib/bag-check.ts` | Offer comparison, stock badges, variants, current-price validation, shared `pickBestOffer()` and `evaluateBag()`. | Core client path present; inventory correctness is not proven without the live non-production RPC/schema. |
| Bag and checkout | `bag.tsx`, `checkout.tsx`, `orders.index.tsx`, `orders.$orderId.tsx` | Variant-aware local bag, shared stock/price evaluation, COD UI, idempotency key and server RPC call, customer order/shipment views. | Mock UI journey verifies interaction only; no real checkout or persistence tested here. |
| Merchant | `studio.index.tsx`, `studio.add-product.tsx`, `studio.settings.tsx`, `studio.orders.$orderId.tsx`, `studio.shipments.tsx` | Store setup, product management, inventory, order quote/rejection/completion, tracking and COD UI. | Source and some local journeys exist; merchant CRUD, authorization and cross-party updates remain unverified against non-production. |
| Delivery carrier | `delivery-register.tsx`, `delivery-dashboard.tsx`, `lib/delivery.ts` | Company enrollment, approval gate, assigned shipment queue, status RPC, realtime and COD collection UI. | Pending-queue UI regression is covered with a fake; assignment, authorization, status transitions and location tracking need authorized backend validation. |
| Administration | No admin route or dedicated admin dashboard is present in `src/routes`. Historical migration files mention administrative DB functions/policies. | Do not infer an operator interface or introduce new privileges from database artifacts. | No application admin UI verified; product owner must define and approve intended admin workflows and roles. |
| Wallet | `wallet.tsx` | Preview UI and disabled deposit/withdraw actions in the existing user changes. | Keep money movement disabled until separately approved and independently reviewed. |
| Cross-cutting | auth, profile, favorites, reviews, notifications, settings, deletion, help and static routes | Shared auth/i18n/theme, feedback, realtime and Sentry/native hooks; route smoke tests. | Coverage is mixed; external auth, notifications, telemetry and deletion require environment-specific verification. |

## Data flow and trust boundaries

1. Route components call domain/data functions in `src/lib`; Supabase is accessed from that boundary rather than directly as a source of trusted state.
2. TanStack Query keys cache data and invalidate related views after confirmed mutations. Realtime subscriptions may prompt refreshes but are not the source of authorization or durable truth.
3. The bag is browser-local convenience state. Offer price, availability, inventory reservation, order status and role authorization must be revalidated on the server/database at mutation time.
4. Checkout sends selected offer IDs, quantities, options, validated contact/address fields and an idempotency key to the RPC. The UI only shows success after the RPC returns an order identifier. The test fake's success response is not evidence of an actual order.
5. Merchant suborders and carrier shipments are distinct concepts. The historical snapshot describes merchant-managed delivery and COD in addition to earlier carrier workflows; verify the deployed canonical RPC behavior before asserting a single end-to-end status model.
6. Never add client-side role checks as a substitute for RLS/RPC authorization. Any required database change needs a separately reviewed, new migration; never execute it automatically.

## Known structural risks / follow-up

- The repo currently has no canonical `supabase/` schema directory; `.migration-backup` is historical reference only.
- No admin route is present. Defining admin tasks, access boundaries, approvals and audit requirements is a product/security decision, not a UI assumption.
- Some role navigation and page copy remain distinct or hardcoded; a consistency project should be incremental and based on page-level review rather than mass replacement.
- Shopper and merchant navigation now share the same design-system frame. Authenticated desktop workflows and route-by-route visual consistency have not yet been browser-reviewed; a shared navigation component does not prove that each role page is visually uniform.
- ESLint reports thousands of formatting warnings and some Fast Refresh warnings. These do not all indicate runtime bugs; address them in scoped batches with snapshots/tests and avoid broad formatting churn.
- Browser/device RTL, offline, storage, and map behavior need browser-level QA; jsdom does not implement WebGL or native plugins.
