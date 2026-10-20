# Development and static hosting

Use Node 24.19.0 (root .node-version and CI) and npm. The application remains the nested Vue/Vite app in `wages-viz-app`; its committed package-lock.json is the installation authority. From the repository root:

```sh
npm run install:locked
npm run lint
npm run type-check
npm run test:unit
npm run build
cd wages-viz-app
npx playwright install --with-deps chromium
cd ..
npm run test:e2e
```

Build and pages:build never install dependencies. Install explicitly once per clean checkout. Lint is read-only. New/changed scripts use strict TypeScript. Four remaining chart SFCs remain JavaScript; their compatibility declaration is not a claim of migration. ESLint accepts those remaining legacy scripts and temporarily exempts only the existing unused declarations in Chart2/Chart3 from no-unused-vars. All other applicable lint rules still run. The original starter E2E assertion is replaced by wage-specific production-build tests.

All verification for this change ran in cloud. The restored environment's `/workspace/onboarding/cache` was used as a writable npm cache. Its system Chromium can be selected with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e`; omit the variable for Playwright-managed Chromium in CI. Headless browser tests always use the already-built preview on port 4173, one worker, no retries, retained failure traces. CI has a 15-minute bound, read-only GitHub permissions, and uploads evidence for 7 days.

For Cloudflare's repository-root build environment, use `npm run cloud:build`: it explicitly installs the nested lock with dev build tools included, then runs the pure build. Do not rely on root automatic dependency installation; the root package has no app dependencies or lockfile. `build` and `pages:build` remain install-free.

The root `wrangler.jsonc` names the existing `bait518` Worker and points its static assets directory at the verified Vite output `wages-viz-app/dist`. For Pages, use repository root, build command `npm run cloud:build`, output `wages-viz-app/dist`, and build variable `SKIP_DEPENDENCY_INSTALL=1`. Worker build settings use the same root/build command; asset output comes from Wrangler rather than a Pages field. No runtime app variables or secrets are required. See [Cloudflare diagnosis and exact owner settings](cloudflare-build.md) for original failed checks, reproduced failures, the Worker name correction, runtime selection, limitations and private-log access gaps. No account settings, deploy command, branch policy, credential or production resource was changed.

The app fetches bundled CSV using Vite BASE_URL. No server adapter, bindings, provider API calls or R/Python worker runtime is required. Build/preview and Wrangler dry-run verification do not establish a deployed site.

The first-year/annual grouped-bar comparison is now a strict TypeScript native Vue/SVG chart with a semantic mobile table. See [its parity, debt inventory and cloud evidence](first-year-migration.md).

Duration migration follow-up (38 unit / 29 browser; JS chart debt 4 → 3): [duration evidence](duration-migration.md). Earlier checkpoint counts above are historical.

All active chart migrations are complete (JS chart debt 3 → 0), including the duration geometry review: [remaining chart evidence](remaining-charts-migration.md). Strict typecheck now includes E2E/tooling. CI runs Chromium, Firefox and WebKit; use `npm run test:e2e -- --project=chromium` when only managed Chromium is available. Earlier checkpoint counts above are historical.
