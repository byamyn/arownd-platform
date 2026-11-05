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


## Execution log — current branch

### B1 — source recovery completed; live verification blocked

- Recovered the historical `supabase/` tree at the repository root: 68 SQL migrations, one Edge Function, and the historical CLI config.
- Deliberately did not restore the historical `seed.sql` into the active `supabase/` directory because it contains demo records.
- Added `supabase/RESTORATION_STATUS.md` explaining the provenance and the approval gate.
- No Supabase project was linked or queried. No `db diff`, baseline migration, migration execution, seed execution, or database write was performed.
- The project reference in the copied config is historical metadata only; the owner must explicitly confirm the authorized non-production project before any remote comparison.

### B7 — partial

- Restored root `.github/workflows/`, `android/`, `ios/`, and `capacitor.config.json`.
- Added a single Node 22 + pnpm release-gate workflow. The old npm-based CI workflow and the legacy workflow that pushed generated changes directly to `main` were not restored.
- Updated the three manual Android workflows to use Node 22 and pnpm. They now fail fast until `@capacitor/cli` and `@capacitor/android` are declared in the active manifest; the current root manifest does not declare either package. This prevents `npx` from silently downloading an unpinned CLI.
- Static dependency review: MapLibre is actively imported; no active-source imports of Leaflet or React-Leaflet were found. `pg` is used by the separate `lib/db` workspace package. `nitro/vite` is imported by the active Vite config. The unused-looking package entries will not be pruned until the pnpm lockfile can be regenerated and the app is verified.
- The active root `package.json` declares MIT while the backup contains proprietary-license drafts; the final licensing choice is explicitly an owner decision and has not been changed.

### B8 — code change committed; runtime validation pending

- Service Worker no longer caches API/Supabase responses or navigation HTML that may contain SSR user state.
- Offline fallback now serves a static, non-personalized `/offline.html`.
- Cache namespaces now rotate automatically from the build ID injected by Vite. Previous Arownd cache namespaces are deleted on worker activation.
- Both normal settings logout and native biometric logout send cleanup messages for legacy user-data caches.
- Added/updated Vitest source assertions. They have not been executed in this environment.

### CI evidence

- GitHub Actions created a job for the restored gate but both initial attempts ended before a runner was assigned (`runner_id=0`, no steps recorded). This is not evidence of a TypeScript, lint, test, or build failure; the cause is not exposed in the available run metadata.
- All five validation commands remain unverified until a runner executes them successfully.
