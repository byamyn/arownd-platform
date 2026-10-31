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
- Create orders through the validated `create_order` RPC. It verifies the caller, item payload bounds, stock, contact fields, and ownership of any payment receipt.
- Customers can only cancel pending orders; merchants must follow the allowed order-state transitions. Direct order deletion is disabled.
- Shipment creation is limited to the order owner, one shipment per order, an approved delivery company, a matching active coverage area, and the configured coverage fee.
- Delivery companies can update only their own shipment status and must follow the allowed shipment-state transitions.
- Merchant order notes are saved through an ownership-checked RPC.
- Wallet inserts are limited to pending top-ups and withdrawals; top-up receipts must be owned by the submitting user.
- The `has_role` helper no longer reveals roles for arbitrary user IDs to ordinary accounts.
- Do not grant broad table-level INSERT or UPDATE permissions when a smaller column-level grant is sufficient.

## Storage

- `store-media` and `product-media` are public catalog-media buckets; their objects have a 10 MiB upload limit and an image MIME allowlist. Upload, update, and delete remain restricted to the owner's folder.
- `receipts` remains private, with a 10 MiB upload limit and an image MIME allowlist.
- Receipt paths, not long-lived signed URLs, are stored for new order and wallet submissions. The app creates 15-minute signed links only when an authorized user opens a receipt.
- Receipt reads are restricted to the owner, the relevant order merchant, or an admin. Never add public-read access to `receipts`.

## Dependency security

- Main CI runs `npm audit --audit-level=high`.
- Dependency updates must avoid `npm audit fix --force` unless a breaking upgrade is reviewed and tested.
- Run TypeScript, ESLint, unit/integration tests, production build, and Android build after dependency changes.

## Remaining pre-launch checks

- Rotate the Supabase database password if it has ever been committed to repository history, then update any server-side environment variables that use it.
- Enable leaked-password protection in Supabase Auth settings (Authentication → Settings → Password Security).
- The approved delivery-company directory now uses a SECURITY INVOKER view backed by a restricted public projection table; the SECURITY DEFINER view warning has been removed.
- Review the remaining SECURITY DEFINER RPC warnings periodically. The current authenticated RPCs include identity, ownership, or admin checks; the anonymous product-view counter only increments a counter and returns no data, but can still be abused to inflate analytics.
- Test profile editing, store creation/editing, product management, order cancellation and status transitions, shipment creation/status transitions, wallet top-ups/withdrawals, receipt access, and image uploads with real customer, merchant, delivery-company, and admin accounts.
- Test the Android APK on a physical device before release.
