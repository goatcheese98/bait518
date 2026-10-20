# First-year / annual chart migration — cloud evidence

This is the next cohesive slice in existing draft #2, following the checkpoint at explorer `946c6f16af1092c6b16f5318951e44834d408edd`. Foundation draft #1 stays at `7c7d5fa9075d33abec3d1b97db9beb23582b7c4a`; that commit remains an ancestor of explorer. Two small follow-up commits separate the validated data contract/parity tests from native Vue chart/table/interaction styling. They append to explorer history; no published history rewrite, merge or release is needed.

## Before / after debt inventory

| Evidence-backed debt | Before | After this slice |
| --- | --- | --- |
| Active chart SFCs with handwritten JavaScript | 5 | 4; Chart4FirstYearVsAnnual.vue is strict TypeScript, not a wrapper |
| First-year source boundary | Unchecked dynamic CSV values and unchecked HTTP response | Shared CSV syntax/schema validation, explicit nullable numeric model, duplicate/non-finite/derived-range checks |
| Exact production aggregate parity | No focused tests | All 10 All industries / All Sectors observations match the legacy series and displayed two-decimal gaps |
| First-year table / recovery | No table; failed requests can appear as an empty chart | Semantic table, selected year, loading/disabled/empty/error/retry states |
| Mobile presentation | Fixed canvas, white surface, chart-only values | Readable scrolling plot, stacked labeled table rows, LUM light/dark tokens and Geist / Geist Mono |
| Automated coverage | 13 unit / 11 browser tests | 28 unit / 23 browser tests; existing coverage retained |
| Lint exceptions | Chart2 / Chart3 unused-variable exceptions; 2 existing viewport-condition warnings | Unchanged; no checks disabled and no new exception |

Remaining active JavaScript charts are Chart2IndustryLeaders, Chart3DurationVsWages, Chart5EmployeesVsRaises and Chart6IndustryWageDistribution. Their original surfaces and internal data handling remain separate debt. This is not a full-repository migration or accessibility audit.

## Data and mathematics

All **56 tracked CSVs are byte-for-byte unchanged** from the checkpoint. Sector/year CSV SHA-256: `f5fb9d93fdd0d71bb4b418104329904e6c3c356a31d04a90981cb9d84ec4e184`.

The selected chart still compares the existing First_Year_Pct_Adjustment_Avg and Annual_Pct_Adjustment_Avg fields, only for All industries / All Sectors, sorted by year. No categories are reclassified or combined. Gap remains **first-year minus annual average**, in percentage points, without compounding. Source precision is retained until formatting; the production values and displayed gaps agree with the independent legacy extraction for every year. Missing fields remain null, zero has an explicit baseline mark, negative bars extend below zero, and a missing operand produces no gap. Extreme finite inputs that overflow the derived plotting range are rejected rather than rendering invalid geometry.

The new shared settlementRows helper performs CSV/schema validation for both the existing public/private explorer and this comparison; each consumer still validates its actual fields. Existing null/zero/filter tests for the original explorer continue to pass.

## Browser and visual verification

The pre-change production build reproduced the missing-table behavior: a focused Playwright test exits 1 because the legacy Chart4 slide has no Table button. Baseline cloud build, lint and the original 13 unit tests exit 0. The first attempted scoped command through the root npm forwarding script did not select tests; the reproduction was rerun directly in the nested app and failed on the actual missing control.

Functional browser tests compare **all 20 plotted series marks** with independent production CSV values, then compare every table row and gap. Runs cover 320/768/1024/1440px, light/dark, reduced motion, keyboard Chart/Table and year selection, series visibility, source recovery, schema/HTTP errors, empty data, negative/missing/zero fixtures and fullscreen/Escape. The selected year is kept visible in the local plot scroller without moving the page. Both chart and table retain no body horizontal overflow.

Browser measurement exposed the gallery grid's 1400px min-content track at a 320px viewport; a minmax(0, 1fr) track fixes the actual layout instead of concealing body overflow. Visual review also caught legacy floating fullscreen/navigation overlays. For the modernized slide, fullscreen is outside the normal data panel and arrows/pagination have separate slots below it. All five gallery views remain navigable; four still use ECharts canvas and this one uses a native Vue/SVG grouped bar plot. The SVG does not animate, so reduced motion retains every observation. Labels do not shrink with mobile width.

[Runtime screenshots](../wages-viz-app/docs/design/screens/) named `adjustments-{320,1440}-{light,dark}-{chart,table}.png` are captured in cloud Chromium. They are not Paper exports. The saved [exact Paper readback](design/paper-readback.json) remains the token/spacing/type reference; the new grouped-bar application of that language is an implementation candidate, not a newly approved Paper artboard. No original canvas PNG or human approval was supplied.

## Commands and review

Managed cloud, Node 24.19.0, writable cache `/workspace/onboarding/cache`. The exact data commit is independently checked; the final source tree is checked with:

- `npm run cloud:build` — explicit nested locked install plus static production build, exit 0
- `npm run type-check` — strict, exit 0
- `npm run lint` — read-only, exit 0, two existing viewport-condition warnings
- `npm run test:unit` — exit 0, 28 tests
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e` — exit 0, 23 tests
- Wrangler 4.151.2 `deploy --dry-run` with metrics disabled and local output — exit 0; packaging only, no upload or account API call
- `git diff --check` and original-byte comparison of all tracked CSV files — pass

Code review covers source validation and arithmetic, escaped labels (no raw HTML), null propagation, SVG axis/bar bounds, controlled chart/table equivalence, observer/request cleanup, responsive parent layout, navigation hit targets and preservation of the original explorer/gallery behavior. Existing bundle-size and two test-lint warnings remain; browser coverage is Chromium only. No new dependency or provider adapter is added.

## Cloudflare remains a separate human-only blocker

Rechecked the available checks on the checkpoint heads before implementation. Both quality workflows are green. Pages and Workers summaries still contain no diagnostic error text and zero annotations; no new cause is exposed. Explorer check links: [Pages 118349457215](https://github.com/goatcheese98/bait518/runs/118349457215), [Workers 118349844384](https://github.com/goatcheese98/bait518/runs/118349844384). No blind hosted rebuild/retry, provider login, secret or account change was attempted.

An owner must open the linked private dashboard logs and provide the first failing phase/command/error (redacting credentials), then compare root, build, output, Node override, dependency-install and integration-access settings against [the existing precise settings table](cloudflare-build.md). Repository root + `npm run cloud:build`, Pages output `wages-viz-app/dist`, Worker assets `./wages-viz-app/dist`, `SKIP_DEPENDENCY_INSTALL=1`, and Node `24.19.0` remain the proven build recipe. A dry-run or green quality workflow is not a deployment success.

Session model ID and reasoning setting are not exposed to this agent; both are unavailable rather than inferred.
