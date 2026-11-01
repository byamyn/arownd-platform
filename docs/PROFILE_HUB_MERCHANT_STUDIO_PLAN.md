# Arownd Profile Hub & Merchant Studio — Implementation Plan

## Approved product decisions

- Profile experience: **Personal Hub**.
- Merchant workspace: **Hybrid Dashboard** (operational summaries plus actionable data tables/lists).
- Store ownership: **single store per merchant account** in the first release.
- Preserve the current Arownd identity: lime `#C6F36B`, dark `#0B0F0C`, white, current typography, Arabic RTL and English LTR.
- Keep the existing TanStack Start / React / Supabase architecture. Do not migrate to another framework.
- Frontend and migration-file work only; do not apply migrations to the live Supabase project without explicit approval.

## Repository baseline

Branch: `arownd-premium`

Baseline commit: `35c6921f70a9e811e799351fc9bb76c02050d8c9`

Existing foundations discovered:

- `src/routes/profile.tsx`: profile identity, profile editing, order/reservation/favorites links, role and store lookup.
- `src/routes/studio.index.tsx`: merchant onboarding, store dashboard, product creation/editing, stock controls, order and reservation operations.
- `src/routes/create-store.tsx`: store creation and existing-store redirect.
- `src/routes/studio.settings.tsx` and `src/routes/studio.shipments.tsx`: supporting merchant areas.
- `src/lib/sooqy.ts`: existing profile, store, offer, order and merchant data operations.
- `src/lib/dictionaries/`: Arabic/English dictionaries.
- `src/components/sooqy/`: shared app shell, page headers, sheets, menus, image uploader and empty/error/loading states.

## Phase 1 — Navigation and layout foundations

### Profile Hub
- Keep `/profile` available to every authenticated account, including merchants.
- Add a clear, optional shortcut from the profile header/menu to `/studio` when the account has a store.
- Retain the existing `/profile?setup=1` customer completion flow and its save/redirect behavior.
- Do not conflate merchant membership with administrator authorization.

### Merchant Studio
- Give `/studio` and its nested routes a full-width application canvas on desktop; consumer-facing routes remain phone-first.
- Preserve the current mobile navigation and existing merchant operations.
- Keep the single-store rule: an account with an existing store is directed to its studio rather than being offered another store creation flow.

## Phase 2 — Personal Hub experience

Proposed information architecture:

1. Identity card: avatar, display name, email and verified contact indicators.
2. Activity summary: orders, reservations and favorites, using real query results only.
3. Account management: personal details, saved address/location, notification preferences and security.
4. Merchant entry: visible only when `fetchMyStore` returns the account's store.
5. Support and legal information.

Implementation requirements:
- Reuse `fetchMyProfile`, `fetchMyOrders`, `fetchMyReservations`, `fetchMyRoles`, `fetchMyStore` and existing update/upload functions.
- Preserve optionality for phone and location unless a downstream flow requires them.
- Move visible strings into paired Arabic/English dictionary keys; maintain dictionary parity.
- Provide loading, empty, error, retry and save feedback states.
- Avoid assuming profile columns exist; retain schema-support checks around optional fields.

## Phase 3 — Hybrid Merchant Studio

Proposed dashboard hierarchy:

1. Store identity and status, with a public-store preview action.
2. Operational KPI cards derived from actual data: pending orders, active products, low/out-of-stock products and reservations requiring action.
3. Action queue for orders/reservations that need merchant attention.
4. Product management with search, stock filters and quick actions.
5. Recent orders and reservations.
6. Shortcuts to store settings, shipments and product creation.

Responsive behavior:
- Desktop: wide content area, clear navigation and denser operational tables.
- Mobile: stacked KPI cards, compact order/product rows, large touch targets and sheets for focused tasks.
- Keep the existing product image uploader and merchant mutation functions.
- Never fabricate revenue, visits, ratings or other metrics when no reliable query exists.

## Phase 4 — Quality and acceptance

- Arabic RTL and English LTR parity for every new visible string.
- Mobile and desktop layout review, including Capacitor viewport behavior.
- Accessible labels, keyboard focus, reduced-motion support and adequate contrast.
- Validate loading/error/empty states and prevent duplicate submissions.
- Confirm one-store behavior and ensure a merchant can still edit their personal profile.
- Run `npm run lint`, `npm run test`, `npx tsc --noEmit` and `npm run build` in a real project runtime before declaring them passed.

## Out of scope until separately approved

- Applying SQL migrations to the live database.
- Introducing a new role/permission model.
- Multi-store switching or multi-store ownership.
- Claiming revenue/traffic analytics without a verified data source.
