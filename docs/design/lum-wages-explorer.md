# LUM wage explorer implementation candidate

Paper handoff: https://app.paper.design/file/01M5B2V5TB8G0HGGA2T01HZQD2/p-1-0

This is an implementation candidate, not a user-approved design. `paper-readback.json` retains the supplied exact layout/style/token evidence; only export metadata with unattached desktop file paths is omitted. The supplied exact JSX/styles/tokens readback guided the native Vue implementation: 288px desktop rail, 24px vertical spacing, 32px result gutters, 24px mobile gutters and 44px actions. At ≤768px a named inline Edit filters disclosure gives direct access to the form without a modal or focus trap. Chart and Table views share a selected-year summary. The plot deliberately scrolls within its labeled region on small screens, keeping 12px axis labels readable.

Reference source read through the GitHub connector on 2026-10-19:

- `goatcheese98/lum-brain/src/styles/design-tokens.ts` blob `e7e0c2362848c209914a5d9da2bcaa5657b663b8` (canonical light and dark palettes, including gold dark accent and themed on-accent).
- `src/styles/fonts.ts` blob `d32cace0ed25de3f8e164b9b2d906ca6e782c0e9`.
- `src/dashboard-shell-css/primitives.ts` blob `86324ebdaca47f0837b09c774e31a96f4d81b2d5` and `shell-chrome.ts` blob `9678f3e1bf6d00e4f2701b355b8612b2a488574b` (actual repository paths; the brief's styles-prefixed paths returned 404).

Geist and Geist Mono Latin variable fonts are self-hosted from Fontsource 5.3.0 with OFL licenses. No font service is needed at runtime. Semantic LUM token names and the 6/8/10/12/16px radius scale are retained; application spacing follows the candidate. Chrome is neutral; private-series blue and public-series foreground have separate dashed/diamond and solid/circle encodings. Focus uses a solid blue outline on the adjacent canvas, independently checked in both palettes.

Only existing CSV values ship. The handoff's fictional years/values/captions are not application data. The CSV's Industry field includes jurisdiction categories; the UI names this explicitly and does not aggregate or reclassify it. Differences are public minus private percentage points, calculated without changing source precision; display uses one decimal place. Missing and absent observations remain null and break plotted lines. Zero stays zero. Duplicate, malformed, non-finite or schema-invalid observations fail visibly with Retry. Empty valid data has a separate state.

The five remaining charts retain their existing slide navigation and fullscreen behavior in an on-demand gallery. Their original white chart surfaces and JavaScript internals are outside this slice; this is not a full repository TypeScript or dark-chart migration. The first comparison has no timed animation, so reduced motion loses no data. No new wage values, external provider requests, source/model changes or deployments were made.

Runtime screenshots are under `../../wages-viz-app/docs/design/screens/`. These are cloud Chromium screenshots, not the Paper PNG exports. Paper PNGs were not attached and are not committed; the original exports can be added later without replacing the candidate.

## First-year / annual follow-up

The first-year/annual comparison now extends these same LUM tokens and type/spacing conventions to a native Vue grouped-bar chart and a stacked mobile source table. It remains in the five-view gallery; four other chart implementations remain JavaScript. This is a tested implementation candidate, without a new Paper artboard or approval. [Runtime/parity evidence](../first-year-migration.md).
