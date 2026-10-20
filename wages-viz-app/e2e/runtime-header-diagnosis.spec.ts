import { test, expect, type Browser } from '@playwright/test'

async function inspectHeaders(browser: Browser, removal: string) {
  const context = await browser.newContext({ colorScheme: 'dark' })
  const page = await context.newPage()
  const before = await page.evaluate(() => matchMedia('(prefers-color-scheme: dark)').matches)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  if (removal !== 'direct') {
    await page.route('http://127.0.0.1:4173/', async (route) => {
      const response = await route.fetch()
      const headers = { ...response.headers() }
      if (removal === 'all-security-headers') {
        for (const name of ['cross-origin-opener-policy', 'content-security-policy', 'permissions-policy', 'x-frame-options', 'x-content-type-options', 'referrer-policy']) delete headers[name]
      } else if (removal !== 'unchanged') delete headers[removal]
      await route.fulfill({ response, headers })
    })
  }
  const response = await page.goto('http://127.0.0.1:4173/')
  expect(response?.status()).toBe(200)
  await expect(page.getByRole('status')).toContainText('10 years')
  const result = { removal, before, ...await page.evaluate(() => ({
    media: matchMedia('(prefers-color-scheme: dark)').matches,
    theme: document.documentElement.dataset.theme,
    background: getComputedStyle(document.body).backgroundColor,
  })), errors }
  await context.close()
  return result
}

test('bounded production header diagnosis', async ({ browser }) => {
  test.setTimeout(60_000)
  const matrix = []
  for (const removal of ['direct', 'unchanged', 'cross-origin-opener-policy', 'content-security-policy', 'permissions-policy', 'all-security-headers']) {
    matrix.push(await inspectHeaders(browser, removal))
  }
  console.log('RUNTIME_HEADER_DIAGNOSIS', JSON.stringify(matrix))
})
