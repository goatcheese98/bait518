import { test as base, expect } from '@playwright/test'

// Pinned Firefox loses its synthetic media override on the first COOP group switch.
// Establish the real origin/isolation first, then apply the requested preference to
// that group before loading a fresh app document. No product header, preference or
// application state is changed, and Chromium/WebKit keep the standard fixture.
export const test = base.extend({
  page: async ({ page, browserName, baseURL, colorScheme }, use) => {
    if (browserName === 'firefox') {
      if (!baseURL) throw new Error('Runtime browser tests require the real workerd baseURL')
      const isolated = await page.goto(new URL('/__browser_isolation__', baseURL).href)
      expect(isolated?.status()).toBe(404)
      expect(isolated?.headers()['cross-origin-opener-policy']).toBe('same-origin')
      await page.emulateMedia({ colorScheme: colorScheme ?? 'light' })
    }
    await use(page)
  },
})
export { expect }
export type { Page } from '@playwright/test'
