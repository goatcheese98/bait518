import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'

export function assetPolicy(): Plugin {
  return {
    name: 'production-asset-policy',
    apply: 'build',
    generateBundle(_options, bundle) {
      // Enumerate actual fingerprinted Vite outputs. Never use a request-time suffix
      // wildcard: a nonexistent hash must not receive an immutable 404 response.
      const paths = Object.keys(bundle).filter((file) =>
        /^assets\/.+-[\w-]{8,}\.(?:js|css|woff2)$/.test(file)).sort().map((file) => `/${file}`)
      if (!paths.some((file) => file.endsWith('.js')) || !paths.some((file) => file.endsWith('.woff2'))) {
        throw new Error('Build did not emit the expected fingerprinted scripts/fonts')
      }
      const directory = fileURLToPath(new URL('../runtime/generated/', import.meta.url))
      mkdirSync(directory, { recursive: true })
      writeFileSync(`${directory}asset-paths.json`, JSON.stringify(paths, null, 2) + '\n')
    },
  }
}
