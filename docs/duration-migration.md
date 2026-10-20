# Duration / wages migration — cloud evidence

This follow-up appends to explorer checkpoint `9da8817bafde13d6569e2ca10957683e72b9d8b9` on draft #2. Foundation draft #1 stays at `7c7d5fa9075d33abec3d1b97db9beb23582b7c4a`, which remains an ancestor and the PR base. No history rewrite or release.

| Debt | Before | After this slice |
| --- | --- | --- |
| Active handwritten JavaScript chart SFCs | 4 | 3: industry leaders, employees/raises, industry distribution |
| Duration source boundary | Unchecked HTTP/dynamic CSV; silent failures | Shared CSV/schema parser; typed nullable fields; duplicate, nonfinite, aggregate/range overflow checks; loading/error/empty/retry |
| Duration diagnostics | Unused educationPoint hidden by file lint waiver | Removed dead declaration and entire Chart3 unused-variable waiver; Chart2 waiver remains |
| Duration accessibility | Canvas and pointer tooltips only | Native Vue/SVG, semantic table, keyboard industry/period/series controls, mobile stacked rows, existing LUM tokens |
| Test coverage | 28 unit / 23 browser | 38 unit / 29 browser, original coverage retained |

## Original output parity

Chart3 was chosen because its per-industry arithmetic means and agreement/employee totals share the remaining Chart5 aggregation pattern. The source is still the real sector/year CSV, with the same eleven industry categories and All Sectors filter. Default period remains 2023–2025. Duration uses one-decimal rounding, annual and first-year adjustments use two, and counts are summed then rounded. Bubble diameters retain the original 18–65 scaling from agreement totals clamped to at least one. Highlight series remain Education & Health, Entertainment & Hospitality, and Other industries; the 3.5% band, 4% threshold and original axis bounds remain. Category marks have shape/stroke differences as well as theme colors.

The original arithmetic explicitly treats blank fields as zero contributions in means and totals. This migration preserves that calculation and its row denominator, while retaining null source fields and displaying a missing-field count separately. A blank is therefore never labeled an observed source zero. No percentages are compounded or converted into wage levels. Existing public/private and first-year percentage-point calculations are unchanged. Year selection is retained in those charts and added as a selectable duration period; the original three-year view remains the default.

Independent tests reproduce the original Papa dynamic-typing extraction and arithmetic for all eleven default points and each production year, checking order, all five displayed statistics and bubble diameters. Browser tests independently compare every production point and table statistic, then select a single year. Fixtures cover null versus zero and negative adjustments, malformed/duplicate/nonfinite/overflow source data, HTTP/schema retry and valid empty data.

All 56 tracked CSV files remain byte-identical to the checkpoint. Sector/year CSV SHA-256 remains `f5fb9d93fdd0d71bb4b418104329904e6c3c356a31d04a90981cb9d84ec4e184`.

## Verification and visual evidence

Managed cloud only: Node 24.19.0, Chromium `/usr/bin/chromium`.

- `npm run cloud:build`: locked nested install and production build, exit 0.
- `npm run type-check`: strict TypeScript, exit 0 (also part of cloud build).
- `npm run lint`: exit 0; two existing browser-test conditional warnings remain.
- `npm run test:unit`: 38 pass, including all prior 28.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e`: 29 pass, including all prior 23. New duration checks run 320/1440px in light/dark with reduced motion, keyboard Chart/Table, period selection, series controls and fullscreen/Escape. Existing tests retain the 320px gallery overflow assertion and 768/1024px coverage.
- Wrangler 4.151.2 `deploy --dry-run` with metrics disabled: local static packaging only; no upload/account call.
- `git diff --check` and comparison of all 56 tracked CSV blobs: pass.

[Cloud runtime screenshots](../wages-viz-app/docs/design/screens/) are named `duration-{320,1440}-{light,dark}-{chart,table}.png`. They show the default three-year chart and a selected 2024 table. Mobile plot scrolling is local, table rows stack without page overflow, and exact values remain accessible without pointer tooltips. The gallery screenshot selector is scoped to the active modern card now that two slides share that reviewed layout.

These screenshots are implementation evidence, not Paper exports or human design approval. The saved exact Paper handoff and existing LUM language remain the reference. No new page layout, dependency, framework or data source was introduced. Browser coverage is Chromium only. Existing bundle-size warning, three legacy JS surfaces and Chart2 lint exception remain.

## Cloudflare boundary

Rechecked the checkpoint's available GitHub summaries: Pages check `118495554485` and Workers check `118495588901` still fail with null error text and zero annotations. No new diagnostic evidence supports an account-side conclusion; no blind provider rebuild was requested. The exact owner-only root/build/output/env comparison and first-failing-command/private-log request remain in [cloudflare-build.md](cloudflare-build.md). Static build and dry-run success do not mean a deployment succeeded. No account settings, credentials, deployment, merge or release were performed.

Model ID and reasoning setting are unavailable in this session; neither is inferred from a role label.
