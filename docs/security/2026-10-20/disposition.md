# Finding-by-finding disposition

Generated from the current registry audit at 2026-10-20 and the complete before/after lock graphs. Counts are vulnerable package entries, not distinct CVEs. The baseline contains 38 entries and 55 distinct direct GHSA IDs. The graph files include every locked runtime, dev, peer and optional edge, including packages for other operating systems. Every original affected installation path and shortest chain from each direct root is retained in before-findings.json.

| Package | Severity | Actual use / boundary | Disposition |
| --- | --- | --- | --- |
| `@babel/core` | low | Build/lint/test or Vue compiler dependency; input paths and roots recorded in before-findings.json, no direct browser-CSV API | Patched lock: 7.29.7 |
| `@humanfs/node` | moderate | Build/lint/test or Vue compiler dependency; input paths and roots recorded in before-findings.json, no direct browser-CSV API | Patched lock: 0.16.8 |
| `@typescript-eslint/eslint-plugin` | high | Build/lint/test or Vue compiler dependency; input paths and roots recorded in before-findings.json, no direct browser-CSV API | Patched lock: 8.72.0 |
| `@typescript-eslint/parser` | high | Build/lint/test or Vue compiler dependency; input paths and roots recorded in before-findings.json, no direct browser-CSV API | Patched lock: 8.72.0 |
| `@typescript-eslint/type-utils` | high | Build/lint/test or Vue compiler dependency; input paths and roots recorded in before-findings.json, no direct browser-CSV API | Patched lock: 8.72.0 |
| `@typescript-eslint/typescript-estree` | high | Build/lint/test or Vue compiler dependency; input paths and roots recorded in before-findings.json, no direct browser-CSV API | Patched lock: 8.72.0 |
| `@typescript-eslint/utils` | high | Build/lint/test or Vue compiler dependency; input paths and roots recorded in before-findings.json, no direct browser-CSV API | Patched lock: 8.72.0 |
| `@vitest/mocker` | moderate | Unit-test tooling; Linux CLI --run, no Vitest UI/API or standalone mocker server; worker pool is a real CI path | Patched lock: 4.1.12 |
| `@vue/eslint-config-typescript` | high | Vue SFC lint discovery; repository glob/ignore configuration, not CSV/browser input | Unresolved upstream, same one GHSA propagated along lint chain |
| `@vue/server-renderer` | high | Vue client rendering is live; SSR server renderer has no app consumer or HTTP server entry | Patched lock: 3.5.44 |
| `ajv` | moderate | Build/lint/test or Vue compiler dependency; input paths and roots recorded in before-findings.json, no direct browser-CSV API | Patched lock: 6.15.0 |
| `baseline-browser-mapping` | moderate | Build/lint/test or Vue compiler dependency; input paths and roots recorded in before-findings.json, no direct browser-CSV API | Patched lock: 2.11.30 |
| `brace-expansion` | high | Build/lint/test or Vue compiler dependency; input paths and roots recorded in before-findings.json, no direct browser-CSV API | Patched lock: 5.0.12 |
| `braces` | high | Vue SFC lint discovery; repository glob/ignore configuration, not CSV/browser input | Unresolved upstream, same one GHSA propagated along lint chain |
| `browserslist` | high | Build/lint/test or Vue compiler dependency; input paths and roots recorded in before-findings.json, no direct browser-CSV API | Patched lock: 4.29.4 |
| `echarts` | moderate | No active source/import/renderer consumer; archival .vue.bak files only | Removed; no installed package path remains |
| `editorconfig` | high | Build/lint/test or Vue compiler dependency; input paths and roots recorded in before-findings.json, no direct browser-CSV API | Patched lock: 3.0.2 |
| `fast-glob` | high | Vue SFC lint discovery; repository glob/ignore configuration, not CSV/browser input | Unresolved upstream, same one GHSA propagated along lint chain |
| `flatted` | high | Build/lint/test or Vue compiler dependency; input paths and roots recorded in before-findings.json, no direct browser-CSV API | Patched lock: 3.4.4 |
| `glob` | high | Build/lint/test or Vue compiler dependency; input paths and roots recorded in before-findings.json, no direct browser-CSV API | Patched lock: 13.0.6 |
| `js-cookie` | high | Development/test transitive dependency; no direct application import | Patched lock: 3.0.8 |
| `js-yaml` | high | Build/lint/test or Vue compiler dependency; input paths and roots recorded in before-findings.json, no direct browser-CSV API | Removed; no installed package path remains |
| `micromatch` | high | Vue SFC lint discovery; repository glob/ignore configuration, not CSV/browser input | Unresolved upstream, same one GHSA propagated along lint chain |
| `minimatch` | high | Build/lint/test or Vue compiler dependency; input paths and roots recorded in before-findings.json, no direct browser-CSV API | Patched lock: 10.2.6 |
| `nanoid` | high | Build/lint/test or Vue compiler dependency; input paths and roots recorded in before-findings.json, no direct browser-CSV API | Patched lock: 3.3.20 |
| `picomatch` | high | Build/lint/test or Vue compiler dependency; input paths and roots recorded in before-findings.json, no direct browser-CSV API | Patched lock: 2.3.2, 4.0.7 |
| `postcss` | high | Build/lint/test or Vue compiler dependency; input paths and roots recorded in before-findings.json, no direct browser-CSV API | Patched lock: 8.5.31 |
| `postcss-selector-parser` | moderate | Build/lint/test or Vue compiler dependency; input paths and roots recorded in before-findings.json, no direct browser-CSV API | Patched lock: 7.1.6 |
| `rollup` | high | Build/lint/test or Vue compiler dependency; input paths and roots recorded in before-findings.json, no direct browser-CSV API | Patched lock: 4.64.12 |
| `shell-quote` | critical | npm-run-all2 build CLI; string arguments, no application-supplied object .op tokens | Patched lock: 1.12.0 |
| `source-map-js` | high | Build/lint/test or Vue compiler dependency; input paths and roots recorded in before-findings.json, no direct browser-CSV API | Patched lock: 1.2.2 |
| `swiper` | critical | Live Vue gallery; options are local constants/state, no untrusted defaults merge API | Patched lock: 12.2.0 |
| `tinypool` | critical | Unit-test tooling; Linux CLI --run, no Vitest UI/API or standalone mocker server; worker pool is a real CI path | Removed; no installed package path remains |
| `typescript-eslint` | high | Build/lint/test or Vue compiler dependency; input paths and roots recorded in before-findings.json, no direct browser-CSV API | Patched lock: 8.72.0 |
| `vite` | high | Build/lint/test or Vue compiler dependency; input paths and roots recorded in before-findings.json, no direct browser-CSV API | Patched lock: 7.3.7 |
| `vitest` | critical | Unit-test tooling; Linux CLI --run, no Vitest UI/API or standalone mocker server; worker pool is a real CI path | Patched lock: 4.1.12 |
| `vue` | high | Vue client rendering is live; SSR server renderer has no app consumer or HTTP server entry | Patched lock: 3.5.44 |
| `ws` | high | Development/test transitive dependency; no direct application import | Patched lock: 8.22.0 |

The exact GHSA titles, affected ranges, current fixes offered by npm, and installation paths are in the raw audit files and finding JSON. Reachability assessment does not suppress or lower any advisory severity. Updated packages absent from the final audit are not claimed to be free of undisclosed vulnerabilities.
