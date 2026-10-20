# Bounded dependency-security slice — 2026-10-20

Baseline: explorer `4777d5cd7a9a5029b13b4236ef7656be2e3837cb`. Foundation stays `7c7d5fa9075d33abec3d1b97db9beb23582b7c4a`. This is a tested implementation candidate on the existing draft stack, not independent approval. The private Cloudflare hosting failures remain separate; no retry or provider/account setting change was made.

## Audit counts and complete scope

| Audit | Before | After |
| --- | --- | --- |
| Full locked graph, dev + optional included | 38: 1 low, 6 moderate, 27 high, 4 critical | 4 high; 0 low/moderate/critical |
| Production dependencies, optional included | 7: 1 moderate, 5 high, 1 critical | 0 |
| Distinct direct GHSA IDs in full results | 55 | 1 |
| Locked package entries, excluding project root | 484 | 434 |
| Locked dependency/optional/peer edges | 802 | 752 |
| Optional flags (overlap dev/runtime flags) | 51 | 53 |
| Platform-restricted locked entries | 50 | 53 |

Counts are npm vulnerable **package entries**, including inherited severity, not counts of unique CVEs. The four critical baseline entries include five distinct critical GHSA IDs because tinypool has two advisories and vitest inherits additional findings. Optional packages for other OS/CPU targets are inventoried even when not installed on Linux. An installed-only list is not substituted for the lock graph.

Evidence: [before graph](before-graph.json), [after graph](after-graph.json), [all baseline affected paths/root chains](before-findings.json), [remaining paths/root chains](after-findings.json), and [package-by-package disposition](disposition.md). Graphs retain every node's version, integrity, dev/optional/platform/engine flags and each dependency, dev-root, optional and peer edge. Unresolved optional peer edges remain explicit. The before graph is from the baseline committed lock; the after graph is from the new lock, SHA-256 `e3c2f410b4fc6f1377035c0215b8a3b076a3530872ad6b002a8948ef3d7e15eb`.

Raw current-registry snapshots: [before full](before-full-audit.json), [before production](before-production-audit.json), [compatible-only intermediate](compatible-full-audit.json), [after full](after-full-audit.json), [after production](after-production-audit.json). These include GHSA URLs, affected ranges, npm's proposed fixes, inherited finding links and precise installation paths. Full-audit exit status remains **1** because the four high entries are unresolved. Production-audit exit status is **0**. No audit level, omit flag or allowlist is used to present the full graph as clean.

Commands from `wages-viz-app`:

```sh
npm audit --include=dev --include=optional --json
npm audit --omit=dev --include=optional --json
npm ls --all --include=optional --json
npm explain braces --json
```

## Changes and compatibility

Source/import/consumer analysis finds no active `echarts`, `vue-echarts` or `<v-chart>` consumer in `src/**/*.ts` / `src/**/*.vue`; only inactive `.vue.bak` archives refer to them. The last chart migration already removed global registration. Removing the two root chart packages removes ECharts 6.0.0, vue-echarts 8.0.1 and its now-unneeded renderer chain, including zrender. No archive, application view or chart was deleted. Pinia and Vue Router are retained because typed counter/router scaffolding still imports them, even though the current app does not mount that router/store.

First, an ordinary declared-range `npm update` reduced the full audit to nine entries. Then narrow supported tooling changes removed the remaining fixable findings:

| Package / chain | Baseline | Final |
| --- | --- | --- |
| Vue / server renderer | 3.5.22 | 3.5.44 |
| Swiper | 12.0.3 | 12.2.0 |
| Vite | 7.1.11 | 7.3.7 |
| Vitest / mocker | 3.2.4 | 4.1.12 |
| tinypool | 1.1.1 via Vitest | No locked or installed path remains |
| ESLint | 9.38.0 | 10.13.0 |
| eslint-plugin-vue | 10.5.1 | 10.11.1 |
| Vue TypeScript lint config | 14.6.0 | 14.9.0 |
| shell-quote | 1.8.3 | 1.12.0 |
| PostCSS | 8.5.6 | 8.5.31 |
| Rollup | 4.52.5 | 4.64.12 |

Other compatible transitive refreshes and platform packages are fully listed in the graphs. Direct security/peer-compatibility floors are raised where needed, and the committed lock pins all exact resolutions. There are **no overrides, force fixes, legacy-peer-deps, package forks or security suppressions**. npm emitted a transient old-plugin peer warning while replacing ESLint and the Vue plugin together; the final `npm ls --all` exits 0 and a clean `npm ci` with `npm_config_strict_peer_deps=true` succeeds, proving the final graph satisfies peer ranges.

[Vite's release policy](https://vite.dev/releases) lists 7.3 as receiving important/security fixes, so moving to Vite 8 is unnecessary for these findings. [ESLint 9 reached EOL](https://eslint.org/version-support/); ESLint 10 is current. Vue lint config 14.9.0 and Vue plugin 10.11.1 explicitly support ESLint 10. Vitest 4.1.12 supports the existing Vite 7 / Node 24 / jsdom stack and contains the patched mocker while retiring tinypool; no unsupported transitive major is forced under Vitest 3. Existing unit tests need no behavioral changes. Nine new Playwright spacing warnings were fixed by inserting blank lines, retaining read-only lint and every rule. Only the two pre-existing viewport-condition warnings remain.

The project engine range now states `^22.13.0 || >=24.0.0`, matching the updated tooling floor and excluding retired Node 20. Execution remains pinned to the already-used Node 24.19.0; no provider setting changes are implied.

## Critical findings: current authoritative advisories and actual use

- [Swiper GHSA-hmx5-qpq5-p643](https://github.com/advisories/GHSA-hmx5-qpq5-p643), affected 6.5.1–before 12.1.2. Swiper is a real gallery runtime dependency. Current gallery options come from local constants/state, not untrusted defaults-merge objects; this bounds the demonstrated input path but does not dismiss the finding. Updated to 12.2.0 and full gallery/mobile/keyboard tests retained.
- [shell-quote GHSA-w7jw-789q-3m8p](https://github.com/advisories/GHSA-w7jw-789q-3m8p), affected through 1.8.3. Exact root chain: `npm-run-all2 → shell-quote`. The build runner really calls `quote` for CLI placeholder arguments, but those calls use strings rather than attacker-controlled `.op` object tokens required by this advisory. The separate parse-complexity advisory is also covered by the update to 1.12.0. No application CSV input enters shell commands.
- [Vitest GHSA-5xrq-8626-4rwp](https://github.com/advisories/GHSA-5xrq-8626-4rwp), patched in 3.2.6 / 4.1.0. This project uses Linux CLI `--run`, not a network-exposed Vitest UI/API or Windows browser/UI mode. It was still updated, rather than treated as an audit exception. The [mocker redirect read](https://github.com/advisories/GHSA-82fw-gwwq-j7x9) needs 4.1.11 or later, motivating the actual move to 4.1.12 instead of stopping at a 3.x patch.
- Tinypool [worker options GHSA-5gmw-xhrv-c9v3](https://github.com/advisories/GHSA-5gmw-xhrv-c9v3) and [run options GHSA-85c8-ppgw-ccpr](https://github.com/advisories/GHSA-85c8-ppgw-ccpr), patched through 2.1.2. Vitest's worker pool is a real dev/CI execution path. These gadgets require an existing prototype-pollution/controlled-options primitive; no working application exploit is asserted, and no exploit or credential access was attempted. Vitest 4 removes the vulnerable dependency entirely. The baseline alternate peer-root path through `@vitest/eslint-plugin → vitest → tinypool` is also recorded in the graph.

For the other findings, [disposition.md](disposition.md) maps all 38 entries to their actual consumer boundary and final resolution; raw advisories and affected paths are preserved, not filtered by perceived exploitability. Two notable runtime-graph cases: the [Vue server-renderer XSS](https://github.com/advisories/GHSA-g2v6-rqmx-r4w6) needs SSR output with unsafe attribute names (this app uses client `createApp`, no SSR server); [ECharts Lines tooltip XSS](https://github.com/advisories/GHSA-fgmj-fm8m-jvvx) has no remaining active consumer. Vue was patched and ECharts removed nonetheless. Compiler/source-map/parser/regex findings were updated on their supported dependency branches. This assessment is not a penetration test or an assertion of immunity to undisclosed flaws.

## Exact remaining upstream issue

[GHSA-vfj7-8cjw-p6xm / CVE-2026-93687](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) affects `braces <=3.0.3`; GitHub's current reviewed advisory lists **no patched version**, and npm's latest braces release is still 3.0.3. One advisory propagates into four high npm package entries:

```text
wages-viz-app (devDependency)
└─ @vue/eslint-config-typescript@14.9.0
   └─ fast-glob@3.3.3
      └─ micromatch@4.0.8
         └─ braces@3.0.3
```

Exact affected paths: `node_modules/@vue/eslint-config-typescript`, `node_modules/fast-glob`, `node_modules/micromatch`, `node_modules/braces`. [npm explain evidence](residual-explain.json) confirms the single chain. These are dev dependencies, not optional packages and not production dependencies. Current consumer code in `@vue/eslint-config-typescript/dist/index.mjs` calls `fg.sync(["**/*.vue"], {cwd: rootDir, ignore, dot: includeDotFolders})`; ignore patterns come from repository ESLint configuration. There is no path from browser CSV values into these glob patterns. Deeply nested hostile patterns can exhaust the lint Node process if introduced into its pattern inputs, so the finding is retained at its reported severity.

npm proposes a downgrade to Vue lint config 14.0.1 to avoid the chain. That is not an upstream braces fix and is not the current ESLint-10-compatible configuration chosen here. We do not downgrade/fork/rewrite the Vue lint setup, replace the dependency under an unsupported range, disable rules or silently accept a production risk to get a zero number. A patched upstream braces/parent release or a separately reviewed supported replacement is the real remaining remediation dependency. This is an upstream package blocker, not a credential/dashboard blocker.

## Verification and boundaries

`npm_config_strict_peer_deps=true npm run cloud:build`, strict app/tooling/unit/E2E typecheck, read-only lint and all 70 unit tests pass. All 51 managed Chromium browser tests pass, retaining the previous 48 plus the three extreme-axis-text regressions. CI is configured to run all 51 in each of Chromium, Firefox and WebKit; the actual result and exact source/CI refs are recorded in draft #2 after completion, not presumed here.

Independent production `dist` served by Python HTTP server, tested with cloud Chromium at 320px: 54 real distribution table rows, unchanged source CSV SHA-256 `f5fb9d93fdd0d71bb4b418104329904e6c3c356a31d04a90981cb9d84ec4e184`, zero page errors/HTTP failures/page overflow. Wrangler 4.151.2 dry-run with metrics disabled succeeds (15 static assets, no bindings/upload/account API). All 56 tracked CSVs remain byte-identical to baseline. LUM UI captures remain visually consistent; no layout, chart-series/mean/rounding/percentage-point change, JS reintroduction or design approval claim.

The [tick-label correction](../../extreme-axis-text-fix.md) is a separate cohesive follow-up in this same owned draft. Full audit remains nonzero as documented. Other OS/CPU optional binaries are inventoried/audited but not executed on this Linux environment. No merge, package publication, provider deployment/account/credential/domain provisioning or data changes. Cloudflare still needs private first-failing logs/settings evidence as described in [hosting evidence](../../cloudflare-build.md); no blind retries are made. Exact model ID/reasoning setting are unavailable.
