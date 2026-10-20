# Cloudflare build investigation — no deployment performed

Historical build investigation. The [local production-runtime follow-up](runtime-rehearsal.md) now prepares a Worker plus assets with status-aware security/cache policy. Asset-only descriptions below describe the earlier checkpoint. The private dashboard/log limitation remains unresolved.

The original foundation HEAD `9cb49706afcd1936813b4ca8d6c7b8a50cbdd19b` and explorer HEAD `4b421a8ebb336f1fee2e5fd6b4bff331a238a599` both have passing GitHub quality workflows and failing Cloudflare Pages/Workers checks. This note separates reproducible repository gaps from unobserved dashboard settings. No Cloudflare account API, login, secret, account setting, deployment, retry, or release was invoked during diagnosis. Wrangler was used only with `deploy --dry-run`, metrics disabled; this neither uploads nor proves a deployment.

## Evidence from existing checks

| Original HEAD | Pages failed check / deployment ID | Workers failed check / build ID |
| --- | --- | --- |
| `9cb4970` | [118342112289](https://github.com/goatcheese98/bait518/runs/118342112289) / `ad5a6510-7a95-40a1-853f-46f89558cd9c` | [118342189917](https://github.com/goatcheese98/bait518/runs/118342189917) / `6c66965f-52f6-4e87-9c49-7c4e30d9dbcb` |
| `4b421a8` | [118343552973](https://github.com/goatcheese98/bait518/runs/118343552973) / `2c4cca08-d9ae-4b85-91e8-df118a1d775c` | [118343677375](https://github.com/goatcheese98/bait518/runs/118343677375) / `d375615f-4d94-4d4c-b504-9d4b0c8d5d5d` |

Pages summaries say only “Build failed.” Workers summaries identify service `bait518` and link its private dashboard logs. All four report zero annotations and null text. The GitHub connector cannot expose check-run annotation endpoints here. The actual hosted command/root/env and first failing log line are not available from these summaries. An account owner must read the linked dashboard logs to confirm whether each observed failure is installation, name validation, output path, or account access. We have not asserted a private-log root cause.

## Repository gaps and scoped fixes

In clean cloud archives of BOTH original commits:

- `npm ci --offline --cache /workspace/onboarding/cache` from repository root exits **1** (`EUSAGE`: no root lockfile). The committed lock lives in `wages-viz-app`.
- Root `npm install --offline --ignore-scripts --cache /workspace/onboarding/cache --no-audit --no-fund` exits **0**, installing no nested app dependencies. Then root `npm run build` exits **127**, `run-p: not found`.
- Installing through the nested lock and then building succeeds. Auto-install at the root is therefore insufficient; a passing install step does not establish an installed application.

`cloud:build` now explicitly runs the nested locked install with `--include=dev`, followed by the pure root build. Build tools such as TypeScript/Vite/npm-run-all2 are dev dependencies, so the include flag also handles a build environment with `NODE_ENV=production`. Ordinary `build` and `pages:build` still perform no installation. No root lockfile or duplicate dependency tree is introduced. CI exercises `cloud:build` directly.

The old `wrangler.jsonc` named `wages-viz-app`, but the checks target Worker service `bait518`. Cloudflare requires these names to agree. The repository name is corrected to `bait518`; its verified static assets directory `./wages-viz-app/dist` and compatibility date are unchanged. A local Wrangler dry-run validates the asset-only config with no bindings. This cannot validate a remote account/tag match and does not establish that this mismatch was the first hosted failure.

A root `.node-version` pins **24.19.0**, the cloud-tested runtime, rather than relying on a provider image default or nested package engines detection. Cloudflare Pages v3 does not detect Node from package.json engines. No package dependencies were upgraded by this follow-up.

## Exact dashboard settings to compare — owner action only

Apply changes only after reviewing the linked private log and the matching draft configuration. No settings below were changed by the agent. Preserve production/preview branch policies; the drafts are not a request to release.

| Setting | Cloudflare Pages project `bait518` | Workers Builds service `bait518` |
| --- | --- | --- |
| Repository | `goatcheese98/bait518` | `goatcheese98/bait518` |
| Root directory | Repository root (`/` or blank in its UI), not `wages-viz-app` | Repository root (`/` or blank in its UI), where `wrangler.jsonc` resides |
| Build command | `npm run cloud:build` | `npm run cloud:build` |
| Output | `wages-viz-app/dist`, relative to repository root | `assets.directory = ./wages-viz-app/dist` in root Wrangler config; there is no Pages output field for Workers |
| Framework preset | Vue/Vite or None with the explicit command/output above | Static assets; existing Vue/Vite build, no server adapter or R/Python runtime |
| Build variable | `SKIP_DEPENDENCY_INSTALL=1` in preview and production build environments | `SKIP_DEPENDENCY_INSTALL=1` in build variables |
| Node | Use root `.node-version` `24.19.0`; remove a conflicting older `NODE_VERSION` override or set it to `24.19.0` | Same |
| App variables/secrets | None required by this static app. Do not add credentials. Remove build-tool pruning overrides if present; cloud:build explicitly includes dev dependencies. | Same. Existing integration-managed account authentication is outside repository config. |
| Deploy/preview command | Managed Pages integration; no CLI deploy added | Inspect the existing commands in the dashboard. The config is an asset-only Worker. `npx wrangler deploy` is the documented production default, **not executed here**. Existing preview policy must not promote these drafts to production. |

The root Wrangler file is a **Workers** config (`assets.directory`), not a Pages config (`pages_build_output_dir`). Those keys are not interchangeable. Pages should use its dashboard output above; do not add Pages-only fields to the shared Workers config. A separate Pages configuration/migration is unnecessary for the verified static build and would require account settings review. If the dashboard root is deliberately nested instead, the equivalent Pages recipe is root `wages-viz-app`, build `npm ci --include=dev && npm run build`, output `dist`, and a Node version override of `24.19.0`. Do not mix this recipe's relative output with the repository-root recipe.

If logs instead show Git installation access or an invalid integration token, only an account owner can repair that existing connection. No credential value is needed by the application or should be pasted into this repository. Retrying/publishing to test account authorization is not part of this task.

## Local cloud verification

Commands are run against isolated source snapshots, with a writable npm cache. `cloud:build` is tested from a clean nested dependency state for both draft trees with `NODE_ENV=production`, including npm **10.9.2**, the documented Workers build-image npm version, on Node **24.19.0**. Its install and production build must exit 0 and produce `wages-viz-app/dist/index.html` plus the unchanged source CSV. Existing focused model tests/typechecks and the explorer's read-only lint/13 unit tests/11 cloud Chromium behavior tests remain the quality gates. Dry-run command, not a deployment:

```sh
WRANGLER_SEND_METRICS=false CI=1 npm exec --yes --package wrangler@4.151.2 -- \
  wrangler deploy --dry-run --outdir /tmp/bait518-dry-run
```

Successful build/dry-run results do not establish corrected dashboard settings, account access, a successful preview, or a deployed site. Hosted check conclusions remain separate evidence.

## Official references checked

- [Workers name requirement](https://developers.cloudflare.com/workers/ci-cd/builds/troubleshoot/#workers-name-requirement)
- [Workers build/root/deploy settings](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
- [Workers image and skip dependency install](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/#skip-dependency-install)
- [Pages build settings](https://developers.cloudflare.com/pages/configuration/build-configuration/)
- [Pages image, Node selection and skip dependency install](https://developers.cloudflare.com/pages/configuration/build-image/)
- [Pages-specific Wrangler configuration](https://developers.cloudflare.com/pages/functions/wrangler-configuration/)
