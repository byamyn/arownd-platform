# Phase 0 execution plan — Arownd release readiness

Scope: execute Phase 0 only on `work/next-task`. No production database access, no migrations, no real-money operations.

## B1 — Supabase source recovery (approval-gated)

- Inventory `.migration-backup/supabase/**` and compare migration history to the authorized non-production project's canonical schema.
- Target files: `supabase/config.toml`, `supabase/migrations/**`, and a new schema-diff/baseline artifact only after evidence confirms what is missing.
- Do not apply migrations or create a baseline from an unverified historical snapshot.
- Before any database change: provide migration rationale, RLS/RPC impact, verification SQL, rollback plan, and stop for owner approval.

## B7 — Repository hygiene

### B7.1 Restore source-controlled native and CI structure

- Restore `.github/workflows/**` to repository root.
- Restore `android/**`, `ios/**`, and root `capacitor.config.json`.
- Keep signing credentials out of the repository; release workflows must consume managed GitHub Actions secrets.
- Use Node 22 and pnpm, matching `package.json` and `pnpm-lock.yaml`.
- Superseded duplicate CI workflows and the legacy native bootstrap workflow that writes directly to `main` are intentionally not enabled.

### B7.2 Correct repository documentation paths

- Update `docs/RELEASE.md`, `docs/REAL_USER_TEST_REPORT.md`, and `docs/ARCHITECTURE.md` to use repository-root paths.
- Keep statements about fake-backed tests and unverified live workflows explicit.

### B7.3 Dependency, license, and secret review (deferred)

- Review `package.json`, `pnpm-lock.yaml`, license files, and all historical commits.
- Do not move/remove dependencies or change licensing without a scoped compatibility/legal review.
- Run a history-aware secret scan; rotate any confirmed exposed credential through its provider.

## B8 — Service Worker privacy (separate code task)

- Inspect `public/sw.js` and all cache strategies.
- Exclude authenticated/private Supabase responses from Cache Storage.
- Clear user-scoped caches on sign-out and define a release cache-version bump policy.
- Add focused tests for private-response exclusion and logout cleanup.

## Verification

Run from repository root, in order:

```sh
npx tsc --noEmit
npm run lint
npm run ui:check
npm test
npm run build
```

The remote GitHub API workflow cannot execute these local commands. Treat checks as pending until the restored CI run reports results. Do not claim a passing result without that evidence.
