# Remaining chart migrations and duration geometry review

This pass completes the three active JavaScript chart migrations following explorer checkpoint `cef22525ab7d8ad4fc1eb311ba6ef5733ce1eef6`. One commit owns each chart; a separate cohesive commit fixes the reviewed duration-axis defect. Existing draft #2 remains based on foundation draft #1 at `7c7d5fa9075d33abec3d1b97db9beb23582b7c4a`; both foundation and the checkpoint remain ancestors. All commits append to the owned explorer branch. No merge, history rewrite or release.

| Debt / behavior | Before | After |
| --- | --- | --- |
| Active handwritten JS chart components | Chart2, Chart5, Chart6 (3) | None (0); all six chart SFCs are TypeScript |
| Retired chart lint waiver | Chart2 unused declarations suppressed | Declarations and waiver removed; no chart lint exception or JS SFC compatibility declaration |
| Industry leaders | Unchecked CSV and canvas-only values | Typed source validation, same ranked top eight, selected period, semantic source table, keyboard inspection, loading/error/empty/retry |
| Regional employees / raises | Unchecked CSV, pointer-only detail | Original four highlighted series plus Other provinces; exact means/totals/bubble sizes; table and keyboard period/region controls |
| Industry distribution | Untyped quartiles / scatter overlay | Same indexed quartiles and yearly observations; source counts, missing/zero access, year toggles and inspection; table |
| Duration axes | Negative observations off plot; large equal finite values produce NaN coordinates | Finite strictly ordered padded extents, visible negative observations and zero reference; relative padding when fixed padding collapses; actionable unsupported-range state |
| Strict checks | App/unit/tooling checks; E2E excluded from TypeScript project | App, unit, tooling and every E2E file checked with strict TypeScript |
| Test counts | 38 unit / 29 Chromium browser | 70 unit / 48 Chromium browser; prior checks retained; CI also runs these 48 cases in Firefox and WebKit |
| Runtime dependency usage | Global unused ECharts registration retained after migrations | Removed registration/imports after last canvas migrated; native Vue, Vite, Swiper and Papa remain; no dependency/lockfile upgrades |

The existing archived `.vue.bak` files are not active components and are unchanged. No fabricated source observations or placeholder charts were added. The original duration/public-private/first-year series and percentage-point calculations remain covered.

## Data and original-output parity

All **56 tracked CSV files are byte-identical** to the checkpoint. Sector/year SHA-256: `f5fb9d93fdd0d71bb4b418104329904e6c3c356a31d04a90981cb9d84ec4e184`.

Each new model is compared with an independent extraction using the original Papa dynamic-typing rules and original arithmetic on production CSV data, for the default period and every individual production year:

- Leaders retain the original eleven industry candidates, All Sectors, 2023–2025 default, available-value adjustment means (blank adjustments are omitted), two-decimal rounding before the positive-average filter, descending order and top-eight selection. Employee counts are summed then rounded. Latest observation retains the original 2025 preference and source-order fallback. Missing-field counts are separate from observed zeros.
- Regional means retain the 2016–2025 default and the original row denominator: blank inputs contribute zero. Employee/agreements totals, full-precision employee averages and annual means are unchanged; only the plotted annual coordinate is rounded to two decimals, matching the original. Displayed means use two decimals and counts are rounded. Bubble diameters retain 18–70 employee-based scaling; British Columbia, Ontario, Quebec, Alberta and Other provinces retain their series order and labels.
- Distribution retains the five original industry categories and 2016–2025 observations. Quartiles use sorted indices floor(n×0.25), floor(n×0.5) and floor(n×0.75), including the original upper indexed median for even samples. They are not interpolated. All 49 production points are retained: Entertainment and hospitality has **no 2023 source row**, so the source has 49 rows, not a complete 50-row grid. No row or zero was invented. The table contains five summaries plus the 49 actual rows (54 total). Missing annual inputs in fixtures remain omitted from the plot/quartiles but visible as Not available in the source table; observed zero remains a real point.

The shared boundary validates CSV schema/syntax, selected categories, finite nullable numbers, duplicate category/year observations and aggregate ranges. The shared request lifecycle checks HTTP status, aborts superseded/unmounted requests, and provides retry. The shared chart frame supplies the same LUM comparison controls, local plot scrolling, semantic tables and stacked mobile rows; calculations stay in separate typed models.

## Duration geometry reproduction and fix

Offline browser fixtures were added **before** changing the duration axes. On the old runtime, the all-negative case emitted `cy=-190`, the mixed-sign case emitted `cy=435` (plot bounds are 60–310), and equal duration/annual `1e20` values emitted non-finite circle coordinates. The ordinary equal-value fixture passed. This reproduced 3 failures / 1 pass without changing CSV files or contacting providers.

The fix keeps the ordinary integer padding and all original point means, rounding, counts and 18–65 agreement-based bubble scaling. Negative domains include a visible zero reference instead of being clamped. When +/-1 or +/-2 collapses under IEEE-754 precision, relative padding produces an ordered representable range. A range that cannot produce finite ordered axes yields an actionable unsupported-range message and retry. Threshold/band rendering respects the visible domain. No data value is clamped or relabeled.

Browser coverage now asserts every circle cx/cy/r and every emitted line/rectangle/text coordinate is finite for all-negative, mixed-sign, equal-value and very-large-finite fixtures. Point centers remain in the plot and radii retain their original bounds. Separate negative-baseline checks ensure negative observations are below a visible zero line. Tables retain exact fixture values. Unsupported-range retry restores production data, and all prior production parity tests still pass.

## Cloud commands and runtime

Node 24.19.0. Everything, including installs, Chromium and screenshots, runs in cloud.

- `npm run cloud:build` — exit 0; locked nested install and production build, including strict app/unit/tooling/E2E typecheck.
- `npm run type-check` — exit 0.
- `npm run lint` — read-only, exit 0; only the two existing viewport-condition warnings remain.
- `npm run test:unit` — 70 pass.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e -- --project=chromium` — 48 pass, including all prior 29 cases. 320px no-page-overflow, keyboard, source access, chart/table parity, period/year selection, five-slide navigation, fullscreen/Escape and recovery remain checked.
- Independent Python HTTP server serving **production dist only**, checked with cloud Chromium at 320px — 54 distribution table rows; source CSV checksum matches; zero page errors, zero HTTP failures and no page overflow. This is separate from Vite preview, which runs the full browser suite.
- Wrangler 4.151.2 `deploy --dry-run` with metrics disabled — exit 0; 15 static assets, no bindings, local packaging only. No upload/provider account API.
- `git diff --check`, 56 CSV blob comparisons and foundation/checkpoint ancestry — pass.

Removing the retired global ECharts registration reduces the entry JS asset from about 770.21 kB to 100.06 kB. The lazy gallery is about 149.85 kB. The prior >500 kB bundle warning is gone; dependency versions and lockfiles are unchanged.

## Browser engines and captures

The managed runtime's `playwright install firefox webkit` attempt exits 1 because the configured network policy returns HTTP 403 **Domain forbidden** for the browser CDN endpoints. No policy or credentials were changed or bypassed. CI now installs Chromium, Firefox and WebKit on its cloud runner and runs all projects; actual results and exact published SHA are reported in draft #2. CI results are not presumed from configuration alone.

[Cloud runtime captures](../wages-viz-app/docs/design/screens/) include `leaders-{320,1440}-dark-{chart,table}.png`, `regions-{320,1440}-light-{chart,table}.png`, `distribution-{320,1440}-dark-{chart,table}.png`, and two 320px negative-duration geometry fixtures. Mobile/desktop captures were visually inspected for readable values, controls, chart bounds and unobstructed local scrolling. These are runtime screenshots, not Paper exports. Existing LUM tokens/layout and the saved exact Paper handoff remain the design reference; no original Paper PNG or human design approval is claimed.

## Remaining external boundary

The private Cloudflare logs/settings blocker remains separate from code/test progress. Available checkpoint check summaries fail with null error text and zero annotations. [Cloudflare build evidence](cloudflare-build.md) records exact owner-only root/build/output/env comparisons: repository root, `npm run cloud:build`, Pages output `wages-viz-app/dist`, Workers assets `./wages-viz-app/dist`, `SKIP_DEPENDENCY_INSTALL=1`, Node 24.19.0, plus the first failing private phase/command/error and integration-access evidence. No blind provider rebuild, deployment, account/secret/domain change or production release was requested or performed. Passing a static build/dry-run does not establish deployment success.

Model ID and reasoning setting are unavailable in this session.
