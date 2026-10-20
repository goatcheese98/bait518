# Production dist under local workerd — no deployment

This preparation wraps the existing Vue/Vite static build in a small TypeScript Worker through the existing root `wrangler.jsonc`. It is a real Wrangler 4.151.2 / workerd local rehearsal in cloud, not a deployed edge or evidence of working Cloudflare account settings. No remote bindings, routes, account ID, secrets, storage, external calls or production commands are configured. `ASSETS` is the local static-assets binding.

## Routes and responses

`src/main.ts` mounts the native Vue app without the dormant router scaffold. Vite's default base is `/`; chart data uses that base and emitted JS/CSS/fonts use `/assets/`. The supported application URL is `/` (query strings do not change its route). The Worker maps only `/` to `/index.html`. Explicit `/index.html` remains valid. This is a client-rendered app but **not an arbitrary-path SPA router**: unknown routes return an actual 404, never index HTML with 200. A deployment under a subdirectory would require a separately tested Vite base/data/assets policy change; it is not claimed supported here.

`assets.run_worker_first: true` makes the response policy apply to every request. `html_handling: none` and `not_found_handling: none` prevent hidden static SPA fallback. Extensionless HTML navigation failures have a bounded LUM-token light/dark recovery page, an accessible keyboard link to `/`, and honest 404/503 status. Missing CSV/font/JS/CSS requests return plain-text 404 even with `Accept: text/html`. Asset access failure returns 503; unsupported methods return 405 with `Allow: GET, HEAD`. Errors use `Cache-Control: no-store`, including an error at an exact known fingerprint (unit regression). HEAD has headers/status and no body.

Successful HTML, data and other non-fingerprinted resources use `no-cache, max-age=0, must-revalidate`; original five public CSVs are byte-exact with `text/csv; charset=utf-8`. Vite's build plugin enumerates **exact actual emitted fingerprinted JS/CSS/woff2 paths** into an ignored generated manifest, bundled into the Worker. Only status 200/206/304 at one of those exact paths gets `public, max-age=31536000, immutable`. There is no request-time wildcard cache rule. The runtime test compares the full actual emitted asset list and bytes with the manifest, checks MIME, and checks nonexistent hash-like and unhashed resources. Build runs Vite before strict tooling types so a clean checkout generates the manifest before the Worker is checked/bundled. A standalone tooling typecheck/unit run requires the build-generated manifest first. Never reuse a manifest from another build.

## Security policy

Every Worker response gets `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, restricted camera/microphone/geolocation/payment permissions, and `Cross-Origin-Opener-Policy: same-origin`. HTTPS additionally gets one-year HSTS for the current host (no preload or subdomain assertion). Local HTTP cannot validate real TLS/HSTS enforcement.

CSP restricts scripts, styles, fonts, connections and images to self (images additionally allow data URLs), forbids objects/base/form actions/framing, and **does not allow inline scripts or eval**. Styles explicitly allow `unsafe-inline`: Vue's dynamic chart/layout styles, Swiper's runtime style attributes and the small recovery stylesheet need it. This is an honest limitation, not a strict style CSP claim. The real browser runtime test watches policy violations and page errors while loading the main app/gallery/font and exercising keyboard fullscreen/recovery. A context-level dark-preference regression verifies actual `matchMedia`, app theme and recovery background across isolated root/404/root navigations. Existing full-suite filters, all six charts/table parity, year/keyboard/mobile/320px overflow, error/empty/retry and extreme negative/large-value geometry/text tests all run against workerd.

## Cloud commands and CI

From repository root:

```sh
npm_config_strict_peer_deps=true npm run cloud:build
npm --prefix wages-viz-app run test:lint-contract
npm run lint
npm run type-check
npm run test:unit
npm --prefix wages-viz-app audit --include=dev --include=optional
npm --prefix wages-viz-app audit --omit=dev --include=optional
CLOUDFLARE_CF_FETCH_ENABLED=false WRANGLER_SEND_METRICS=false WRANGLER_CHECK_FOR_UPDATES=false \
  npm --prefix wages-viz-app run runtime:dry-run
# CI installs all three Playwright browser engines first.
CLOUDFLARE_CF_FETCH_ENABLED=false WRANGLER_SEND_METRICS=false WRANGLER_CHECK_FOR_UPDATES=false \
  npm run test:e2e
```

For an interactive local-only cloud rehearsal, the same environment prefix with `npm --prefix wages-viz-app run runtime:local` listens on loopback 127.0.0.1:4173. `send_metrics: false` and disabled dependency instrumentation are also committed in Wrangler config. Playwright explicitly sets `CLOUDFLARE_CF_FETCH_ENABLED=false` (Miniflare's separate network metadata switch), metrics false and update-check false; `--local`, no remote binding, no login and no account command. The initial targeted test revealed the separate metadata switch and it was explicitly disabled before the complete verification run. Startup/debug logs show disabled metrics; no account API is used for this rehearsal.

The hosted quality job is bounded to 15 minutes, one browser worker, 30 seconds per case, zero retries, a 60-second local-server startup, and `reuseExistingServer: false`. It gates the full audit, lint contract, strict types, units, build, no-upload dry-run and all three browser engines. An always-run seven-day artifact includes HTML reports, failure traces, screenshots, Wrangler logs, the exact generated asset list and the lint discovery contract. Capture paths: [mobile recovery](../wages-viz-app/docs/design/screens/runtime-404-320.png), [desktop recovery](../wages-viz-app/docs/design/screens/runtime-404-1440.png), plus the unchanged explorer/gallery captures beside them. Both recovery captures were visually inspected in cloud; no new Paper/human approval is asserted.

## First hosted rehearsal and recovery

[Run 39395050736](https://github.com/goatcheese98/bait518/actions/runs/39395050736) passed the strict build, lint contract, full audit, 73 units, dry-run and 166/174 browser cases. Eight Firefox dark-mode cases failed: initial root theme stayed light when preference was set with a page-level override before navigation under opener isolation. All Chromium/WebKit cases and all seven new runtime cases passed. [Failure traces/logs](https://github.com/goatcheese98/bait518/actions/runs/39395050736/artifacts/12251338142) remain available.

The affected suites first tried Playwright browser-context `colorScheme` preferences, preserving every original theme/contrast/parity assertion and the opener-isolation header. [Run 39396193983](https://github.com/goatcheese98/bait518/actions/runs/39396193983) proved that insufficient: 168/177 passed, and the new Firefox check observed actual `matchMedia` false after navigation. A new real navigation case explicitly checks browser `matchMedia`, rendered dark app theme, dark recovery page and return to root across isolated documents. This adds one case per engine (177 total). No rule/header/assertion is disabled, app theme code and all data/math stay unchanged, and a complete new hosted run verifies the follow-up; exact results are reported in draft #2.

## Pinned Firefox cause and supported harness correction

The bounded [header-comparison job](https://github.com/goatcheese98/bait518/actions/runs/39397451657/job/118543609127) used the exact pinned Playwright/Firefox 1.64.1 and actual local workerd responses, with a new dark-configured context for each case. [Raw matrix](firefox-coop-diagnosis.json): before navigation all six cases report dark. After real root navigation, direct and unchanged responses report light. Removing only COOP **in the diagnostic browser interception** preserves dark. Removing CSP or Permissions-Policy does not; removing all security headers also preserves dark. All cases have zero page errors. No Worker header or product source was changed by that comparison. The temporary comparison test/job is retired after identifying the cause.

The initial COOP browsing-context-group transition resets the pinned Firefox synthetic media override, including its context default. This is a harness/engine emulation interaction, not evidence that production CSS should be weakened or app data/theme should be forced. The public-API fixture now establishes a real same-origin COOP document first, verifies its real 404 status and `COOP: same-origin`, then applies the requested Playwright media preference **before navigating to a fresh app document**. It uses the existing honest unknown-route response; no bootstrap endpoint or product condition is added. Chromium/WebKit use the standard fixture. The application still initializes from actual `matchMedia`; no product preference/palette code changes.

The existing eight dark cases and all original data/table/math/keyboard/contrast assertions remain unconditional. The explicit navigation regression asserts actual media before/after root, app `data-theme`, dark recovery background and return-to-root theme, with the same opener-isolation header. CI first gates this focused Firefox case and then runs the complete unchanged three-engine suite (177 cases), with zero retries and full CSP/audit/type/lint/unit/dry-run gates. Exact final results are reported in the draft, not presumed from the harness change. The priming request is test setup only; it does not claim a deployed edge or native OS preference emulation outside the pinned engines.

## Hosting limitations

Both existing Cloudflare integrations remain external failures without useful public diagnostics at the reviewed checkpoint. Do not blindly retry, change settings or label them deployed. [Historical investigation and precise dashboard evidence needed](cloudflare-build.md) remains applicable for build root, output, Node, dependency install and first-failing private log lines. This increment changes the Workers config from asset-only to a Worker plus static-assets binding. The repository-root build remains `npm run cloud:build`, Node 24.19.0, and `wages-viz-app/dist` output; the main script and generated manifest must come from that same build. No remote deployment/preview command was invoked here.

**Pages is separate:** a plain Pages static publish of `dist` would not execute this Worker or inherit its status-aware headers/cache/recovery policy. No Pages Functions adapter, dashboard migration or claim of equivalent Pages hosting is made. An account owner must provide the actual integration kind/root/build/output/preview command/Node/pruning settings and first failing logs before a hosting-specific remedy can be verified. Production promotion remains unauthorized. Local workerd cannot prove edge caching/TLS/account authorization, dashboard configuration, real deployment success or other-platform optional binaries.
