# Arownd — Security baseline

> **Project:** Arownd  
> **Owner:** byamyn  
> **Repository:** [byamyn/arownd-platform](https://github.com/byamyn/arownd-platform)  
> **Status:** Engineering baseline; not a completed security audit or legal certification.

## 1. Security model

Arownd has shopper, merchant, platform-administration and delivery-company roles. Authorization must be enforced at trusted boundaries:

- PostgreSQL RLS protects row access.
- RPCs and server-side handlers validate identity, role, ownership and state transitions.
- Client-side route guards improve user experience but are not authorization controls.
- Sensitive actions must not trust a client-supplied user ID, role, price, balance or ownership claim.

## 2. Secrets and environment variables

The repository's `.env.example` currently lists both browser-prefixed Supabase settings and server-side settings. Treat this file as a template only.

- `VITE_*` variables are bundled for browser use and must contain public values only.
- `SUPABASE_SERVICE_ROLE_KEY` and `DATABASE_URL` are server/developer-only credentials.
- Never reference privileged secrets from browser modules or expose them through Vite `define`, API responses or client logs.
- Keep real `.env` files out of Git and rotate any credential that is accidentally exposed.
- Review Vercel environment variables by environment (development, preview and production) without printing secret values.

## 3. Authentication and request protection

The current repository configures:

- Supabase authentication integration in `src/integrations/supabase/`.
- Supabase auth attachment in `src/start.ts`.
- TanStack Start CSRF middleware for server functions in `src/start.ts`.
- Request locale and SSR error handling in `src/server.ts`.

Do not disable CSRF protections, trust arbitrary Origin headers, or accept unvalidated redirect targets to work around native WebView behavior. Native PKCE and callback flows require separate platform testing.

## 4. Database authorization

For every affected table, verify RLS policies for shopper, merchant, administration and delivery-company access. Test both positive and negative cases.

For SECURITY DEFINER RPCs:

- Set a safe fixed `search_path`.
- Revoke default PUBLIC/anon execution where inappropriate.
- Grant execution only to required roles.
- Check `auth.uid()` and the ownership/role relationship inside the function.
- Validate allowed state transitions and prevent replay/duplicate operations.

## 5. High-risk business operations

Treat checkout, reservations, wallet/settlement, COD collection, shipment assignment and account deletion as high-risk workflows.

- Keep multi-step financial/order operations transactional.
- Enforce idempotency on the server.
- Never trust totals or balances supplied by the browser.
- Keep an auditable ledger for money movement.
- Prevent users and merchants from changing another party's records.
- Preserve transaction evidence according to an approved retention schedule.

## 6. File and user-content handling

For uploads and user-generated content:

- Validate file type, size and ownership at trusted boundaries.
- Use private storage and short-lived access where content is not public.
- Avoid exposing private contact or report details in public queries.
- Restrict moderation data to authorized reviewers.
- Apply explicit retention and deletion rules to uploaded objects and tokens.

## 7. CI and dependency hygiene

The repository's main CI workflow includes a dependency audit step using `npm audit --audit-level=high`. Keep dependency installation lockfile-based with `npm ci`. Review dependency alerts and update dependencies in isolated changes with tests.

## 8. Pre-release security checklist

- [ ] Confirm no privileged secret is present in browser bundles or public repository files.
- [ ] Review Vercel environment scopes and production secrets.
- [ ] Review RLS policies and RPC grants for all four roles.
- [ ] Test cross-account and cross-role access denial.
- [ ] Test checkout idempotency and stock consistency.
- [ ] Test wallet and COD ledger invariants.
- [ ] Test shipment ownership and state transitions.
- [ ] Review auth callbacks, CSRF and redirect validation.
- [ ] Review storage access and deletion behavior.
- [ ] Verify backups can be restored.
- [ ] Confirm error monitoring does not collect secrets or unnecessary personal data.

## 9. Incident response

If a credential or personal-data exposure is suspected:

1. Restrict access and preserve relevant audit evidence.
2. Revoke/rotate affected credentials using the provider's supported process.
3. Determine scope and affected environments.
4. Fix the root cause and add a regression test.
5. Assess notification and legal obligations with the responsible owner/adviser.
6. Record the incident and recovery actions without copying secrets into the report.

## 10. Verification boundary

This document records required controls and repository configuration observed during documentation work. It does not certify a penetration test, live RLS state, Vercel configuration, secret inventory or legal compliance.
