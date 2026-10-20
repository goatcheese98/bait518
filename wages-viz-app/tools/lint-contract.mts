import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { ESLint } from 'eslint'

// Historical effective configs, captured before removing the wrapper. Compare every rule,
// parser/delegate option, plugin, global and discovered path, not just a lint exit code.
const baseline = JSON.parse(await readFile('../docs/security/2026-10-20/flat-config/before.json', 'utf8')) as {
  files: Record<string, number>
  groups: unknown[]
}
const eslint = new ESLint()
const normalize = (value: unknown): unknown => JSON.parse(JSON.stringify(value))
async function effective(file: string) {
  const config = await eslint.calculateConfigForFile(file)
  assert(config, `Missing effective config: ${file}`)
  const options = JSON.parse(JSON.stringify(config.languageOptions.parserOptions, (key, value) =>
    key === 'parser' && typeof value === 'object'
      ? Object.fromEntries(Object.entries(value).map(([lang, parser]) => [lang,
        typeof parser === 'object' && parser !== null ? (parser as { meta: unknown }).meta : parser]))
      : value))
  return normalize({ rules: config.rules, parser: config.languageOptions.parser.meta,
    parserOptions: options, ecmaVersion: config.languageOptions.ecmaVersion,
    sourceType: config.languageOptions.sourceType, globals: config.languageOptions.globals,
    processor: typeof config.processor === 'object' ? config.processor.meta : undefined,
    plugins: Object.keys(config.plugins) })
}
const results = await eslint.lintFiles(['.'])
const discovered = results.map((result) => path.relative(process.cwd(), result.filePath)).sort()
for (const [file, group] of Object.entries(baseline.files)) {
  assert(discovered.includes(file), `Previously linted file disappeared: ${file}`)
  assert.deepEqual(await effective(file), baseline.groups[group], `Effective config changed: ${file}`)
}
for (const directory of ['dist', 'dist-ssr', 'coverage', 'playwright-report', 'test-results']) {
  for (const prefix of ['', 'nested/']) {
    assert(await eslint.isPathIgnored(`${prefix}${directory}/nested/ignored.ts`), `${prefix}${directory} must be ignored`)
  }
}
const fixtures = [
  { file: 'src/nested/deeper/typed.mts', source: 'export const answer: number = 42', rules: [] },
  { file: 'src/nested/deeper/typed.tsx', source: 'export const answer: number = 42', rules: [] },
  { file: 'src/nested/deeper/TypedFixture.vue', source: '<script setup lang="ts">\nconst value: number = 42\n</script>\n<template>{{ (value as number).toFixed(1) }}</template>', rules: [] },
  { file: 'src/nested/deeper/CoreOverrides.vue', source: '<script lang="ts">\nexport default class Model { constructor(public value: number) {} }\n</script>\n<template><div /></template>', rules: [] },
  { file: 'src/nested/deeper/RuleFixture.vue', source: '<script setup lang="ts">\nconst unused: any = 1\n</script>\n<template><div /></template>', rules: ['@typescript-eslint/no-explicit-any', '@typescript-eslint/no-unused-vars'] },
  { file: 'src/nested/deeper/rules.ts', source: 'export const value: any = 42', rules: ['@typescript-eslint/no-explicit-any'] },
  { file: 'src/nested/deeper/ScriptLang.vue', source: '<script setup>\nconst value = 42\n</script>\n<template>{{ value }}</template>', rules: ['vue/block-lang'] },
  { file: 'src/nested/deeper/TemplateRules.vue', source: '<script setup lang="ts">\nconst value = true\n</script>\n<template><div v-if="value" v-else /></template>', rules: ['vue/valid-v-else', 'vue/valid-v-else', 'vue/valid-v-if'] },
  { file: 'src/nested/__tests__/focused.spec.ts', source: "import { test, expect } from 'vitest'\ntest.only('focused', () => { expect(1).toBe(1) })", rules: ['vitest/no-focused-tests'] },
  { file: 'e2e/nested/focused.spec.ts', source: "import { test, expect } from '@playwright/test'\n\ntest.only('focused', async ({page}) => { await expect(page).toHaveTitle('Wages') })", rules: ['playwright/no-focused-test'] },
]
for (const fixture of fixtures) {
  const [result] = await eslint.lintText(fixture.source, { filePath: fixture.file })
  assert(result)
  assert.equal(result.fatalErrorCount, 0, `Parser failed: ${fixture.file}`)
  assert.deepEqual(result.messages.map((message) => message.ruleId).sort(), fixture.rules.sort(), fixture.file)
}
const [malformed] = await eslint.lintText('<script setup lang="ts">const x: =</script>', { filePath: 'src/nested/deeper/BrokenFixture.vue' })
assert.equal(malformed?.fatalErrorCount, 1, 'Malformed TS must fail inside an SFC')
await mkdir('logs', { recursive: true })
await writeFile('logs/lint-contract.json', JSON.stringify({ baselineFiles: Object.keys(baseline.files).length,
  discovered, fixtures: fixtures.length + 1, equivalent: true }, null, 2) + '\n')
console.log(`Lint contract: ${Object.keys(baseline.files).length} original files/configs equal; ${fixtures.length + 1} nested parsing/rule fixtures passed.`)
