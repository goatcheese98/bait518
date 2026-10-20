import { test, expect } from './runtimeFixtures'
import { readFile, readdir, mkdir } from 'node:fs/promises'
import assetPaths from '../runtime/generated/asset-paths.json' with { type: 'json' }

const revalidate = 'no-cache, max-age=0, must-revalidate'
const immutable = 'public, max-age=31536000, immutable'

test('workerd: root HTML, CSP, browser resources and keyboard recovery', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 1000 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const errors: string[] = []
  const policies: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.exposeFunction('recordPolicyViolation', (directive: string) => policies.push(directive))
  await page.addInitScript(() => document.addEventListener('securitypolicyviolation', (event) => {
    void (window as unknown as { recordPolicyViolation: (directive: string) => Promise<void> }).recordPolicyViolation(event.violatedDirective)
  }))
  const response = await page.goto('/')
  expect(response?.status()).toBe(200)
  expect(response?.headers()['cache-control']).toBe(revalidate)
  expect(response?.headers()['content-security-policy']).toContain("script-src 'self'")
  expect(response?.headers()['content-security-policy']).not.toContain("script-src 'self' 'unsafe-inline'")
  expect(response?.headers()['x-content-type-options']).toBe('nosniff')
  expect(response?.headers()['x-frame-options']).toBe('DENY')
  expect(response?.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin')
  expect(response?.headers()['permissions-policy']).toContain('camera=()')
  expect(response?.headers()['cross-origin-opener-policy']).toBe('same-origin')
  await expect(page.getByRole('status')).toContainText('10 years')
  await page.evaluate(() => document.fonts.ready)
  expect(await page.evaluate(() => document.fonts.check('16px Geist'))).toBe(true)
  await page.getByRole('button', { name: 'Show other charts' }).click()
  const gallery = page.locator('#legacy-gallery')
  await expect(gallery.locator('.swiper-slide-active svg[role="img"]')).toBeVisible()
  await gallery.getByRole('button', { name: 'Enter Fullscreen' }).focus()
  await page.keyboard.press('Enter')
  await expect(gallery).toHaveClass('fullscreen')
  await page.keyboard.press('Escape')
  await expect(gallery).not.toHaveClass('fullscreen')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect(errors).toEqual([])
  expect(policies).toEqual([])
})

test('workerd: every public CSV is byte-exact, CSV MIME and revalidated', async ({ request }) => {
  const files = (await readdir('public/data')).filter((file) => file.endsWith('.csv'))
  expect(files.length).toBeGreaterThan(0)
  for (const file of files) {
    const response = await request.get(`/data/${file}`)
    expect(response.status(), file).toBe(200)
    expect(response.headers()['content-type'], file).toBe('text/csv; charset=utf-8')
    expect(response.headers()['cache-control'], file).toBe(revalidate)
    expect(await response.body(), file).toEqual(await readFile(`public/data/${file}`))
  }
})

test('workerd: exact emitted JS, CSS and fonts have correct bytes, MIME and immutable cache', async ({ request }) => {
  const actual = (await readdir('dist/assets')).map((file) => `/assets/${file}`).sort()
  expect(assetPaths).toEqual(actual)
  for (const file of assetPaths) {
    const response = await request.get(file)
    expect(response.status(), file).toBe(200)
    expect(response.headers()['cache-control'], file).toBe(immutable)
    expect(response.headers()['x-content-type-options'], file).toBe('nosniff')
    const mime = response.headers()['content-type'] ?? ''
    expect(mime, file).toMatch(/^(?:text\/javascript|application\/javascript|text\/css|font\/woff2)/)
    expect(await response.body(), file).toEqual(await readFile(`dist${file}`))
  }
})

test('workerd: missing route is an accessible real 404, then root recovers', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 1000 })
  const response = await page.goto('/unknown/nested-route')
  expect(response?.status()).toBe(404)
  expect(response?.headers()['cache-control']).toBe('no-store')
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  await expect(page.locator('#app')).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Open wage explorer' })).toBeFocused()
  await mkdir('docs/design/screens', { recursive: true })
  await page.screenshot({ path: 'docs/design/screens/runtime-404-320.png', fullPage: true })
  await page.keyboard.press('Enter')
  await expect(page.getByRole('status')).toContainText('10 years')
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/unknown-route')
  await page.screenshot({ path: 'docs/design/screens/runtime-404-1440.png', fullPage: true })
})

test('workerd: missing CSV, fonts, JS and CSS never return index HTML or immutable errors', async ({ request }) => {
  for (const file of ['/data/missing.csv', '/assets/geist-missing123.woff2', '/assets/index-missing123.js',
    '/assets/index-missing123.css', '/assets/unhashed.js', '/nested/index-missing123.js']) {
    const response = await request.get(file, { headers: { Accept: 'text/html' } })
    expect(response.status(), file).toBe(404)
    expect(response.headers()['content-type'], file).toBe('text/plain; charset=utf-8')
    expect(response.headers()['cache-control'], file).toBe('no-store')
    expect(response.headers()['x-content-type-options'], file).toBe('nosniff')
    expect(await response.text(), file).toBe('Not found\n')
  }
})

test('workerd: HEAD and method handling do not expose app HTML or cache errors', async ({ request }) => {
  const head = await request.head('/')
  expect(head.status()).toBe(200)
  expect(head.headers()['cache-control']).toBe(revalidate)
  expect(await head.body()).toHaveLength(0)
  const missing = await request.head('/assets/missing1234.js')
  expect(missing.status()).toBe(404)
  expect(missing.headers()['cache-control']).toBe('no-store')
  expect(await missing.body()).toHaveLength(0)
  const post = await request.post('/')
  expect(post.status()).toBe(405)
  expect(post.headers()['allow']).toBe('GET, HEAD')
  expect(post.headers()['cache-control']).toBe('no-store')
})

test('workerd: actual missing CSV response reaches the app error state and retry recovers', async ({ page }) => {
  let missing = true
  await page.route('**/data/TABLEAU_sector_year.csv', async (route) => {
    if (missing) {
      const response = await route.fetch({ url: 'http://127.0.0.1:4173/data/missing.csv' })
      await route.fulfill({ response })
      return
    }
    await route.continue()
  })
  await page.goto('/')
  await expect(page.getByRole('alert')).toContainText('could not load')
  missing = false
  await page.getByRole('button', { name: 'Retry', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('status')).toContainText('10 years')
  await page.getByRole('button', { name: 'Table', exact: true }).click()
  await expect(page.getByRole('row', { name: /2016 1.3% 1.5% -0.2 pp/ })).toBeVisible()
})


test.describe('workerd browser preference across opener isolation', () => {
  test.use({ colorScheme: 'dark' })

  test('dark preference and rendered theme survive root, missing-route and root navigation', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 1000 })
    expect(await page.evaluate(() => matchMedia('(prefers-color-scheme: dark)').matches)).toBe(true)
    const response = await page.goto('/')
    expect(response?.headers()['cross-origin-opener-policy']).toBe('same-origin')
    await expect(page.getByRole('status')).toContainText('10 years')
    expect(await page.evaluate(() => matchMedia('(prefers-color-scheme: dark)').matches)).toBe(true)
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    const missing = await page.goto('/unknown-preference-route')
    expect(missing?.status()).toBe(404)
    expect(await page.evaluate(() => matchMedia('(prefers-color-scheme: dark)').matches)).toBe(true)
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(10, 10, 11)')
    await page.screenshot({ path: 'docs/design/screens/runtime-404-320-dark.png', fullPage: true })
    await page.getByRole('link', { name: 'Open wage explorer' }).click()
    await expect(page.getByRole('status')).toContainText('10 years')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  })
})
