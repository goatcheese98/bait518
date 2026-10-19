# Wage explorer foundation

Stack base: repository default main at b8e8f6389ab2db478017be5d1a3a0c89f65fc97b. This is the first dependent draft; the LUM UI/browser draft builds on it. No source CSV, data transformation pipeline, other repository, deployment or release is changed.

Root builds previously invoked npm install every time. Installation is now explicit (`npm run install:locked` uses the nested committed lock), while build/pages:build only run compilation. Lint is read-only. Papa Parse is reused with unknown-valued records and runtime schema/row/duplicate checks; the sole dependency addition is its exact development type declaration package. Typed comparisons preserve missing versus zero, sort years, filter inclusively and calculate percentage-point differences.

The existing restored checkout and package/lock hashes matched the onboarding integrity snapshot and GitHub main SHA. Checks use the managed cloud workspace, writable cache `/workspace/onboarding/cache`, Node 24.19.0 and npm 11.9.0. No local credentials were read or transferred.

Foundation verification: locked install, focused model/test read-only ESLint, existing type-check, Vitest (13 tests including 12 data-contract cases), and production build. The first CI gate deliberately lints the new typed model/tests; the dependent UI PR expands the read-only lint gate after resolving/scoping baseline issues.

Baseline observations are separate: original type-check/unit/build exit 0; original full read-only ESLint exit 1 (15 existing errors); original Playwright exit 1 because it expects the Vue starter heading “You did it!” instead of the wage dashboard. These pre-existing UI/lint issues belong to the dependent draft. The build retains the existing ECharts chunk-size warning. This foundation does not claim UI modernization, full-repository TypeScript conversion, or a deployed site.

## Cloudflare follow-up

The original foundation above passed its quality workflow, while the existing Pages and Workers integrations failed. [Cloudflare investigation](cloudflare-build.md) reproduces the clean root installation gap on both original heads, aligns Wrangler's Worker name with the check target, adds explicit `cloud:build` with dev build tools included, and pins the cloud-tested Node version. The foundation remains based on main; the explorer is rebased onto this follow-up foundation. CI now exercises the explicit cloud build and uses `.node-version`. No account settings or deployment were performed.
