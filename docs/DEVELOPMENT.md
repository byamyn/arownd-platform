# Arownd — Development guide

> **Project:** Arownd  
> **Owner:** byamyn  
> **Repository:** [byamyn/arownd-platform](https://github.com/byamyn/arownd-platform)  
> **Status:** Local workflow guide; resolve the Node.js version discrepancy before standardizing developer machines.

## 1. Prerequisites

The current `package.json` declares Node.js `26.x`, and both primary GitHub Actions workflows currently use Node.js 26. The project engineering baseline supplied for Arownd specifies Node.js 22.

This is an unresolved configuration conflict. Do not silently change `package.json`, CI or Vercel runtime settings until Node 22 versus Node 26 is explicitly decided and the complete install, test and build workflow has been validated on the selected version.

Use the package manager version compatible with the selected Node.js release and preserve `package-lock.json`.

## 2. Clone and install

```bash
git clone https://github.com/byamyn/arownd-platform.git
cd arownd-platform
npm ci
```

Create a local environment file from the template:

```bash
cp .env.example .env
```

Set only the values required for the local environment. Do not commit `.env`. Keep server-only credentials out of browser-exposed `VITE_*` variables.

## 3. Run the application

```bash
npm run dev
```

The project also defines these build modes:

```bash
npm run build
npm run build:vercel
npm run build:capacitor
npm run preview
```

The Vercel build runs the Vite build and then bundles the server entry for the Vercel deployment.

## 4. Quality checks

Run the complete local verification sequence before submitting a change:

```bash
npx tsc --noEmit
npm run lint
npm run ui:check
npm test
npm run build
```

For a change affecting the Vercel server bundle, also run:

```bash
npm run build:vercel
```

Do not report a check as passing unless it was actually run against the changed revision.

## 5. Tests

Tests use Vitest and Testing Library. Test files are present under `src/lib/` and `src/test/`.

For business-logic changes, add focused tests for:

- Expected successful behavior.
- Invalid or boundary inputs.
- Unauthorized or cross-account access where applicable.
- Duplicate/retried operations for sensitive mutations.
- Regression behavior for the bug being fixed.

## 6. Database development

Local Supabase scripts are defined in `package.json`:

```bash
npm run db:start
npm run db:stop
npm run db:reset
npm run db:studio
```

Use a new migration for every schema change. Never edit an already-applied migration. Read [DATABASE.md](./DATABASE.md) before changing schema, RLS or RPC behavior.

## 7. Frontend conventions

- Arabic and RTL are the default experience; preserve LTR support.
- Use translation keys from `src/lib/i18n.ts` and `src/lib/dictionaries/`.
- Use CSS logical properties for directional spacing.
- Support light and dark themes.
- Include loading, empty, error and confirmed-success states.
- Do not report success before the server confirms the operation.
- Use the established confirmation/dialog components rather than native `alert` or `confirm`.
- Reuse `pickBestOffer()` and `evaluateBag()` for offer and bag logic.
- Preserve legacy `sooqy` filenames and identifiers until compatibility is verified.

## 8. Pull request expectations

Each change should include:

1. A concise description of behavior and motivation.
2. The files changed and why.
3. Tests added or updated for changed logic.
4. The verification commands run and their results.
5. Known limitations and anything not tested.
6. Database migration and RLS notes if schema or authorization changed.

Keep pull requests focused. Do not combine broad formatting, dependency upgrades and business-logic changes without a clear reason.
