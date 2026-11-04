# Arownd — Development guide

> **Project:** Arownd  
> **Owner:** byamyn  
> **Repository:** [byamyn/arownd-platform](https://github.com/byamyn/arownd-platform)  
> **Status:** Node.js 26.x is the approved project baseline.

## 1. Prerequisites

Use **Node.js 26.x** for local development, GitHub Actions and Vercel builds.

The repository and deployment configuration have been checked:
- `package.json` declares `engines.node: 26.x`.
- Both primary GitHub Actions workflows use Node.js 26.
- The Vercel project `arownd` is configured with `nodeVersion: 26.x`.

Check your local version before installing dependencies:

~~~bash
node --version
npm --version
~~~

The Node.js major version must be 26. Use the npm version compatible with the selected Node.js release and preserve `package-lock.json`.

## 2. Clone and install

~~~bash
git clone https://github.com/byamyn/arownd-platform.git
cd arownd-platform
npm ci
~~~

Create a local environment file from the template:

~~~bash
cp .env.example .env
~~~

Set only the values required for the local environment. Do not commit `.env`. Keep server-only credentials out of browser-exposed `VITE_*` variables.

## 3. Run the application

~~~bash
npm run dev
~~~

The project also defines these build modes:

~~~bash
npm run build
npm run build:vercel
npm run build:capacitor
npm run preview
~~~

The Vercel build runs the Vite build and then bundles the server entry for the Vercel deployment.

## 4. Quality checks

Run the complete local verification sequence before submitting a change:

~~~bash
npx tsc --noEmit
npm run lint
npm run ui:check
npm test
npm run build
~~~

For a change affecting the Vercel server bundle, also run:

~~~bash
npm run build:vercel
~~~

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

~~~bash
npm run db:start
npm run db:stop
npm run db:reset
npm run db:studio
~~~

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
