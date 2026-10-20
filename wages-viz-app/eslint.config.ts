import { defineConfig, globalIgnores } from 'eslint/config'
import type { Linter } from 'eslint'
import tseslint from 'typescript-eslint'
import vueParser from 'vue-eslint-parser'
import pluginVue from 'eslint-plugin-vue'
import pluginVitest from '@vitest/eslint-plugin'
import pluginPlaywright from 'eslint-plugin-playwright'

// All active Vue scripts use strict TypeScript; no legacy chart exceptions remain.

export default defineConfig(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },

  globalIgnores([
    '**/dist/**',
    '**/dist-ssr/**',
    '**/coverage/**',
    '**/playwright-report/**',
    '**/test-results/**',
  ]),

  pluginVue.configs['flat/essential'],
  // Apply the upstream TS core-rule overrides to Vue scripts as well as TS files.
  // Vue's parser must then wrap the TS parser; never parse an SFC as plain TS.
  (tseslint.configs.recommended as Linter.Config[]).map((config) => ({
    ...config,
    ...(config.files ? { files: [...config.files, '**/*.vue'] } : {}),
  })),
  pluginVue.configs['flat/base'],
  {
    name: 'app/vue-typescript',
    files: ['*.vue', '**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: { js: 'espree', jsx: 'espree', ts: tseslint.parser, tsx: tseslint.parser },
        ecmaVersion: 2024,
        ecmaFeatures: { jsx: false },
        extraFileExtensions: ['.vue'],
      },
    },
    rules: { 'vue/block-lang': ['error', { script: { lang: ['ts'], allowNoLang: false } }] },
  },

  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/__tests__/*'],
  },

  {
    ...pluginPlaywright.configs['flat/recommended'],
    files: ['e2e/**/*.{test,spec}.{js,ts,jsx,tsx}'],
  },
)
