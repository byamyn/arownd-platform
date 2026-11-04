# Arownd — Architecture overview

> **Project:** Arownd  
> **Owner:** byamyn  
> **Repository:** [byamyn/arownd-platform](https://github.com/byamyn/arownd-platform)  
> **Status:** Repository-level architecture map; verify implementation before changing runtime boundaries.

## 1. Product boundaries

Arownd is a local-commerce platform for Algeria. The repository models four platform roles:

- **Shopper:** discovery, products, offers, bag, checkout, orders and reservations.
- **Merchant:** store, products, inventory, offers and merchant orders.
- **Delivery company:** delivery-company profile, coverage and shipment workflows where enabled.
- **Platform administration:** privileged operational and moderation capabilities.

The presence of a route or database object does not prove that the workflow is enabled or production-ready. Check the current UI, server authorization and database policies together.

## 2. Runtime shape

The current application is a React 19 + TypeScript application built with Vite 8 and TanStack Start/Router.

- `src/router.tsx` and `src/routeTree.gen.ts` define the client routing setup and generated route tree.
- `src/routes/` contains route-level application screens.
- `src/start.ts` configures TanStack Start middleware, including the server-function CSRF middleware and Supabase auth attachment.
- `src/server.ts` wraps the TanStack server entry and applies request locale handling and SSR error normalization.
- `api/index.ts` is the Vercel Node serverless entry that serves client assets and forwards dynamic requests to the bundled server application.
- `vite.config.ts` configures TanStack Start, React, Tailwind CSS and the Capacitor SPA build mode.

Do not bypass the server middleware or create a second authorization path for convenience.

## 3. Data and service boundaries

Supabase is the backend platform used by the application. The repository includes:

- `supabase/migrations/` — versioned PostgreSQL schema and policy changes.
- `src/integrations/supabase/` — Supabase client integration.
- `src/lib/` — application services and domain logic.
- `src/hooks/use-realtime.ts` — realtime-related client hook.

Treat browser Supabase credentials as public. Database authorization must be enforced by RLS and trusted server-side functions/RPCs, not by route visibility or client-side role checks alone.

## 4. Important domain modules

These paths are present in the current repository tree:

| Area | Code location |
|---|---|
| Legacy-compatible data services | `src/lib/sooqy.ts` |
| Authentication | `src/lib/auth.tsx` and `src/integrations/supabase/` |
| Bag and validation | `src/lib/bag.tsx`, `src/lib/bag-check.ts` |
| Delivery | `src/lib/delivery.ts`, `src/lib/shipping.ts` |
| Localization | `src/lib/i18n.ts`, `src/lib/dictionaries/`, `src/lib/locale.ts` |
| Maps and geospatial helpers | `src/lib/geo.ts` and map components |
| Error monitoring | `src/lib/error-capture.ts`, `src/utils/sentry.ts` |

Keep the legacy `sooqy` identifiers until all imports, persisted identifiers and compatibility requirements have been traced.

## 5. Native applications

Capacitor is configured in `capacitor.config.json` with:

- App ID: `com.arownd.app`
- App name: `Arownd`
- Web directory: `dist/client`

The repository contains Android and iOS projects. Their presence does not certify that native builds, deep links, authentication, push notifications or store releases have passed device testing.

## 6. Build and hosting

- Local web build: `npm run build`
- Vercel build: `npm run build:vercel`
- Vercel output directory: `dist/client`
- Vercel serverless entry: `api/index.ts`

The Vercel configuration routes dynamic requests to the server entry and applies response headers. Revalidate caching, headers and route behavior whenever the server architecture changes.

## 7. Architecture invariants

1. Keep secrets and privileged database credentials on trusted server infrastructure only.
2. Enforce role and record ownership in RLS/RPC/server authorization.
3. Implement sensitive order, reservation and wallet operations transactionally and idempotently on the server.
4. Treat migrations as append-only; never rewrite an applied migration.
5. Preserve Arabic-first RTL behavior and translation-key parity.
6. Reuse the established offer and bag domain logic instead of duplicating price calculations.
7. Add focused Vitest coverage when changing business logic.

## 8. Verification boundary

This document is a map of repository structure, not a complete threat model or runtime certification. Confirm live Supabase configuration, Vercel project settings, deployed environment variables and native platform behavior independently.
