# Cloud verification and review

Current follow-up: [first-year chart migration evidence and before/after debt inventory](first-year-migration.md). The earlier checkpoint evidence below remains pinned to its original heads.

Stack 1: [foundation draft #1](https://github.com/goatcheese98/bait518/pull/1), branch `codex/lum-wages-foundation`, tested HEAD `9cb49706afcd1936813b4ca8d6c7b8a50cbdd19b`, base main `b8e8f6389ab2db478017be5d1a3a0c89f65fc97b`. Independently tested snapshot tree `29aa472b19ab9f7490b0ce4a280ead1e32d5eaf9` exactly equals the published tree. Locked install, focused read-only lint, typecheck, 13 Vitest tests and build all exit 0. No UI behavior changes in that draft.

Original implementation evidence below is pinned to the original heads. A follow-up corrects Cloudflare root installation and Worker naming; see [the diagnosis](cloudflare-build.md) for current build instructions, exact settings and reproduction. It does not claim deployment success.

Stack 2: branch `codex/lum-wages-explorer`, targets the foundation branch above. The split keeps the typed contract/build change independently reviewable. The original slideshow shell is mechanically extracted into LegacyGallery.vue with typed event handlers, leaving the five remaining chart implementations intact. The Paper JSON is supplied design evidence; font files/licenses and screenshots are mechanical assets.

## Final cloud command results

Execution: managed cloud, Node 24.19.0, npm 11.9.0, system Chromium, writable npm cache `/workspace/onboarding/cache`. Expanded execution was required for subprocess/browser sandbox support; no local machine or credential transfer was used. All commands below exit 0 from the repository root:

- `npm run install:locked -- --offline --cache /workspace/onboarding/cache`
- `npm run lint` (read-only; zero errors, two intentional viewport-conditional Playwright warnings)
- `npm run type-check` (strict for changed TypeScript SFCs/model; legacy JavaScript is explicitly not migrated)
- `npm run test:unit` — 13 tests, including 12 quoted CSV/schema/duplicate/filter/null/zero/ordering/difference cases and the existing starter component test
- `npm run build` — static Vite production output; existing large ECharts chunk warning remains
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e` — 11 tests against the production preview; all pass
- `git diff --check`

The final CI workflow runs the same install/lint/type/unit/build/browser gates, with managed Chromium installation and a 15-minute job bound. Cloud completion is not a claim that GitHub-hosted CI has already completed.

## Browser evidence

Eight full interaction runs at 320, 768, 1024, 1440px in light/dark with reduced motion verify apply/reset, source values, selecting years, table row keyboard activation, legend toggles, visible focus, theme switching, font loading, and no body horizontal overflow. Tests compare real 2016 source values (1.3% public, 1.5% private, -0.2 percentage points). Focus and series contrasts are calculated from both actual palettes: text/muted/accent text ≥4.5:1; series/focus blue ≥3:1 against the canvas. Selected-year controls are keyboard alternatives to plot points. Chart/Table are semantic pressed-state buttons; Table has column/row headers and a caption.

Additional normal-motion browser contexts exercise loading/disabled Apply, HTTP/network/schema failure, Retry, empty/clear filters, missing versus zero, invalid/reversed periods, selected-year retention/reselection, all five other chart slides, and fullscreen Escape/cleanup. No screenshot-only functional claims. The initial functional run caught and corrected the Selected year label's inclusion of option text. A canvas-gallery assertion was corrected to validate slide identity and rendered canvases rather than expecting chart text in the DOM.

Runtime PNGs: [screens](../wages-viz-app/docs/design/screens/). Desktop/mobile screenshots were visually reviewed for fit, spacing, readable axis labels, selected caption, and themes. They are Chromium captures of production data. Original Paper PNGs were not attached and are not represented as committed.

## Baseline and limits

The original restored checkout matched GitHub default main and onboarding integrity hashes. Original typecheck/unit/build exit 0. Original read-only lint exits 1 with 15 pre-existing errors; original Playwright exits 1 on its obsolete “You did it!” heading assertion. Full lint now scopes unused-variable exceptions to the two untouched legacy chart files; generated browser reports are ignored. No new broad lint exclusions apply to the explorer.

Five legacy charts retain their original JavaScript internals, white chart surfaces and existing ECharts behavior. Browser coverage is cloud Chromium, not a claim of Firefox/WebKit, full assistive-technology testing, or a whole-repository accessibility audit. CSV categories and original datasets/research files are unchanged. There is no race/required animation in the modernized first journey. Static output was verified and Cloudflare config preserved in the original implementation; the follow-up aligns the Worker name and adds an explicit cloud build, with dashboard instructions only. No provider API calls, production deployment, release, merge, broad dependency upgrades or package publication occurred.

Final code review checked typed boundary validation, duplicate handling, null propagation, SVG numeric inputs, Vue's escaped source labels (no raw HTML), request abort/observer cleanup, filter/year state, narrow-screen overflow and scoped legacy styling. There is no new secret/config input, executable data, or background external service request.
