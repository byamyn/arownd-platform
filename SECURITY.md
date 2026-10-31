# Arownd Security Baseline

This document records the security controls currently enforced by the application and the remaining pre-launch actions.

## Repository and secrets

- Never commit database connection URIs, database passwords, service-role keys, signing keys, or local Supabase CLI metadata.
- Store server-only secrets in the deployment provider's encrypted environment variables.
- Public Supabase publishable keys may be present in client builds; service-role keys must never be exposed to the browser or APK.
- If a database password or other credential has ever appeared in Git history, rotate it. Removing the current file does not invalidate historical copies.

## Database and authorization

- Keep Row Level Security enabled on application tables.
- Use ownership checks in RLS and server-side RPCs; do not rely on client-side role checks.
- Sensitive columns such as verification flags, commissions, ratings, order totals, and shipment ownership must not be writable by ordinary authenticated users.
- Create orders through the validated `create_order` RPC.
- Merchant order notes are saved through an ownership-checked RPC.
- Do not grant broad table-level INSERT or UPDATE permissions when a smaller column-level grant is sufficient.

## Storage

- `store-media`, `product-media`, and `receipts` have a 10 MiB upload limit and an image MIME allowlist.
- Receipt objects remain in a private bucket and are readable only by their owner or through an authorized signed URL.
- Never add a public-read policy to the `receipts` bucket.

## Dependency security

- Main CI runs `npm audit --audit-level=high`.
- Dependency updates must avoid `npm audit fix --force` unless a breaking upgrade is reviewed and tested.
- Run TypeScript, ESLint, unit/integration tests, production build, and Android build after dependency changes.

## Remaining pre-launch checks

- Rotate the Supabase database password if it has ever been committed to repository history, then update any server-side environment variables that use it.
- Enable leaked-password protection in Supabase Auth settings.
- Review the remaining Supabase Security Advisor findings, especially the approved-delivery-companies public projection view and SECURITY DEFINER RPCs.
- Test profile editing, store creation/editing, product management, order status and notes, shipment status, and image uploads with real customer and merchant accounts.
- Test the Android APK on a physical device before release.
