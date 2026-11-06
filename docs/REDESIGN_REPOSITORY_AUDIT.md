# Repository Redesign Audit — Cross-cutting Review

Branch: `work/next-task`
Audit date: 2026-11-06

## Executive result

The redesign is **not yet complete across the entire repository**. The core shopping, checkout, merchant, and delivery surfaces received substantial visual work, and a static scan found that many route files use logical Tailwind spacing classes. However, several routes still contain Arabic UI literals and have not been migrated to the shared dictionaries. The root navigation guard initially used native `window.confirm`; this was replaced during the follow-up pass with the shared `ConfirmDialog` for both browser links and the Android back button.

This report deliberately distinguishes static source review from executable verification. No claim of passing tests or production build is made.

## Scope reviewed

Reviewed the active route inventory, shared shell/navigation, shared design primitives, translation groups, and the delivery changes from the preceding phase. Route files were scanned for Arabic text literals and physical-direction Tailwind utilities (`pl-`, `pr-`, `ml-`, `mr-`, `left-`, `right-`, `text-left`, `text-right`).

## Findings

### 1. Translation and localization gaps

Arabic UI literals remain in multiple active routes. Notifications, wallet, and reservations were migrated in the latest follow-up batch; the remaining representative findings are:

| Route | Approx. non-comment Arabic lines found | Examples |
|---|---:|---|
| `category.$catId.tsx` | 17 | Sort labels, category hint, back label |
| `products.$productId.tsx` | 6 | Share error, report action |
| `stores.$storeId.tsx` | 37 | Store empty/error states, weekdays, toasts |
| `checkout.tsx` | 4 | Tracking label and action |
| `studio.index.tsx` | 30 | Metadata, store state, accessibility labels |
| `studio.settings.tsx` | 12 | Metadata and image accessibility labels |
| `create-store.tsx` | 6 | Metadata, page title, login guidance |
| `profile.tsx` | 9 | Anonymous profile and accessibility labels |
| `settings.tsx` | 64 | Metadata and user-facing feedback |
| `delete-account.tsx` | 34 | Statuses and page copy |
| `about.tsx` | 41 | Entire informational page |
| `help.tsx` | 78 | FAQ categories and content |
| `privacy.tsx` | 114 | Legal copy and accessibility labels |
| `terms.tsx` | 108 | Legal copy and accessibility labels |

Counts are source-line indicators, not exact counts of visible strings; they can include arrays, metadata, and accessibility attributes. Nevertheless, they demonstrate that Arabic/English parity is not yet complete across the application.

#### 1.1 Latest localization batch (2026-11-06)

- Added `src/lib/dictionaries/activity.ts` with matching Arabic/English keys for notifications, wallet, and reservations.
- Registered the group in `src/lib/dictionaries/index.ts`.
- Migrated `src/routes/notifications.tsx`, `src/routes/wallet.tsx`, and `src/routes/reservations.index.tsx` to translation keys; static scan found no remaining Arabic UI literals in these three routes (comments excluded).
- Added dictionary parity assertions for wallet/notifications/reservations and added `/reservations/` to route smoke coverage.
- Static dictionary scan: 120 activity keys in each language, no missing language counterparts, no unresolved translation references, and no new cross-group collisions. Existing allowed accessibility-key duplicates remain unchanged.
- The settings page and other routes in the findings table are still outstanding; this batch does not complete localization.

## 2. Directional CSS

The route scans completed for the shopper, checkout, order, merchant, and profile/settings route groups found no direct physical-direction Tailwind utilities from the audited patterns. This is a positive static signal, but it does not prove full LTR correctness: icons, map controls, third-party widgets, mixed-direction identifiers, and component internals still require visual testing.

### 3. Translation key collision fixed

The delivery dictionary previously defined generic keys `delivery_address` and `delivery_fee`, overriding base dictionary meanings after `GROUPS` were merged into the shared dictionary. This could cause unrelated screens to display interpolation placeholders or the wrong text.

Fixed by renaming them to:
- `delivery_company_delivery_address`
- `delivery_company_shipment_fee`

Added regression assertions for these scoped names and a group-level collision guard. The only permitted duplicate keys are the existing shared/UI accessibility and retry labels.

### 4. Delivery implementation defects fixed

- Replaced the unsafe `Record<string, unknown>` registration payload and type assertion with the generated Supabase Insert type and conditional object spreads.
- Applied the existing stat-card color prop to the icon; it was previously accepted but not rendered.
- Added regression assertions for the typed payload and stat icon class.
- Corrected the Arabic `login_required` translation, which contained an accidental English fragment.

### 5. Root navigation confirmation fixed

- Replaced native `window.confirm` in the browser unsaved-form guard with the shared `ConfirmDialog`.
- Replaced native `window.confirm` in the Android back-button handler with the same dialog.
- Kept the pending destination in a ref; confirming clears the dirty-form set and resumes the original anchor click so TanStack Router can handle client-side navigation rather than forcing a full page reload.
- Added bilingual confirmation copy and a regression assertion that the root contains no native `window.confirm` and wires both pending-navigation paths.

The dialog flow is statically reviewed but still needs browser and Android runtime verification, especially repeated taps, Escape/back behavior, and focus restoration.

### 6. Mobile and visual validation

Static source checks found logical spacing utilities in the reviewed route groups, but no actual device/browser visual regression was performed. The following remain unverified:
- 320, 360, 390, and 430px viewport behavior
- iOS/Android safe areas and keyboard interactions
- fixed bottom navigation vs sticky action bars and sheets
- landscape, tablet, and desktop layouts
- dark/light mode contrast and focus visibility
- screen-reader and keyboard navigation across all routes

## Files changed in this audit

- `src/lib/dictionaries/delivery.ts` — scope delivery-specific address/fee keys to avoid global collisions.
- `src/lib/dictionaries/activity.ts` — add bilingual notifications, reservations, and wallet copy.
- `src/lib/dictionaries/index.ts` — register the activity dictionary group.
- `src/routes/notifications.tsx` — migrate visible UI and SEO copy to translations.
- `src/routes/reservations.index.tsx` — migrate visible UI, statuses, and confirmation copy to translations.
- `src/routes/wallet.tsx` — migrate wallet labels, statuses, feedback, and metadata to translations.
- `src/test/i18n-parity.test.ts` — add wallet and activity translation assertions.
- `src/test/journey.test.tsx` — add reservations route smoke coverage.
- `src/routes/delivery-dashboard.tsx` — use the scoped keys and render stat icon colors.
- `src/routes/delivery-register.tsx` — use a typed Supabase Insert payload without an unsafe cast.
- `src/test/i18n-parity.test.ts` — add dictionary collision and scoped-key regression checks.
- `src/test/delivery-mobile-layout.test.ts` — cover stat icon styling and typed registration payload.
- `src/lib/dictionaries/ui.ts` — add bilingual unsaved-change confirmation copy for the planned root guard replacement.
- `src/lib/i18n.ts` — correct the Arabic login-required message.
- `src/routes/__root.tsx` — replace browser and Android native confirmation prompts with the shared dialog; resume client-side navigation after confirmation.
- `src/test/navigation-layout.test.tsx` — add a regression check for the shared unsaved-change dialog and absence of `window.confirm`.

## Verification status

Static GitHub source inspection only. The following commands were **not run** in an executable checkout:
- `npx tsc --noEmit`
- `npm run lint`
- `npm run ui:check`
- `npm test`
- `npm run build`

The latest branch status is affected by Vercel `build-rate-limit`; it is not a valid application build result.

## Release recommendation

Do not mark the redesign complete or release-ready yet. Prioritize:
1. Migrate the listed route copy into bilingual dictionaries and verify parity.
2. Runtime-test the new root confirmation dialog and browser/native back behavior.
3. Run the full verification command set in a real checkout.
4. Complete visual and accessibility checks on mobile and desktop.
5. Only then approve the redesign for the MVP pilot.

No database migrations, RLS changes, deployments, or merges to `main` were made.
