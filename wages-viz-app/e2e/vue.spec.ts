import { test, expect } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

for (const width of [320, 768, 1024, 1440]) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`${width}px ${colorScheme}: filter, select, table, reset, keyboard`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' })
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      await page.goto('/')
      await expect(page.getByRole('status')).toContainText('10 years')
      await page.keyboard.press('Tab')
      await expect(page.getByRole('link', { name: 'Skip to wage explorer' })).toBeFocused()
      expect(
        await page
          .getByRole('link', { name: 'Skip to wage explorer' })
          .evaluate((el) => getComputedStyle(el).outlineStyle),
      ).toBe('solid')
      await page.keyboard.press('Enter')
      if (width <= 768) await page.getByRole('button', { name: 'Edit filters' }).click()
      await page.getByLabel('From year', { exact: true }).selectOption('2016')
      await page.getByLabel('To year', { exact: true }).selectOption('2020')
      await page.getByRole('button', { name: 'Apply filters' }).click()
      await expect(page.getByRole('status')).toContainText('5 years')
      await page.getByLabel('Selected year', { exact: true }).selectOption('2016')
      const detail = page.getByRole('region', { name: 'Selected year values' })
      await expect(detail).toContainText('1.3%')
      await expect(detail).toContainText('1.5%')
      await expect(detail).toContainText('-0.2 pp')
      await page.getByRole('checkbox', { name: 'Public sector' }).uncheck()
      await expect(page.locator('.public-line')).toHaveCount(0)
      await expect(page.locator('.private-line')).toHaveAttribute('d', /^M/)
      await page.getByRole('checkbox', { name: 'Public sector' }).check()
      await page.getByRole('button', { name: 'Table', exact: true }).click()
      await expect(page.getByRole('table')).toBeVisible()
      await expect(page.getByRole('row', { name: /2016 1.3% 1.5% -0.2 pp/ })).toBeVisible()
      await page.getByRole('button', { name: 'Select year 2017', exact: true }).focus()
      await page.keyboard.press('Enter')
      await expect(page.getByLabel('Selected year', { exact: true })).toHaveValue('2017')
      await page.getByLabel('Industry / source category').selectOption('Manufacturing')
      await page.getByRole('button', { name: 'Apply filters' }).click()
      await expect(page.getByRole('table')).toContainText('Manufacturing')
      await page.getByRole('button', { name: 'Reset filters' }).click()
      await expect(page.getByLabel('Industry / source category')).toHaveValue('All industries')
      await expect(page.getByRole('status')).toContainText('10 years')
      await page.getByRole('button', { name: 'Chart', exact: true }).click()
      await expect(page.locator('.public-line')).toBeVisible()
      const chart = page.getByRole('region', { name: /^Annual adjustment chart;/ })
      await chart.focus()
      await expect(chart).toBeFocused()
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true)
      await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme)
      expect(
        await page.locator('.public-line').evaluate((el) => getComputedStyle(el).animationName),
      ).toBe('none')
      if (width <= 768) await page.getByRole('button', { name: 'Edit filters' }).click()
      await page.evaluate(() => document.fonts.ready)
      expect(await page.evaluate(() => document.fonts.check('16px Geist'))).toBe(true)
      const contrast = await page.evaluate(() => {
        const css = getComputedStyle(document.documentElement)
        const luminance = (color: string) => {
          const hex = color.trim().replace('#', '')
          const full =
            hex.length === 3
              ? hex
                  .split('')
                  .map((c) => c + c)
                  .join('')
              : hex
          const rgb = [0, 2, 4]
            .map((i) => parseInt(full.slice(i, i + 2), 16) / 255)
            .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
          return rgb[0]! * 0.2126 + rgb[1]! * 0.7152 + rgb[2]! * 0.0722
        }
        const ratio = (a: string, b: string) => {
          const first = luminance(css.getPropertyValue(a)),
            second = luminance(css.getPropertyValue(b))
          return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
        }
        return {
          text: ratio('--fg', '--bg'),
          muted: ratio('--mut', '--bg'),
          chart: ratio('--blue', '--bg'),
          accent: ratio('--on-acc', '--acc'),
        }
      })
      expect(contrast.text).toBeGreaterThanOrEqual(4.5)
      expect(contrast.muted).toBeGreaterThanOrEqual(4.5)
      expect(contrast.chart).toBeGreaterThanOrEqual(3)
      expect(contrast.accent).toBeGreaterThanOrEqual(4.5)
      await mkdir('docs/design/screens', { recursive: true })
      await page.screenshot({
        path: `docs/design/screens/explorer-${width}-${colorScheme}.png`,
        fullPage: true,
      })
      await expect(page.getByRole('button', { name: 'Dark mode', exact: true })).toHaveAttribute(
        'aria-pressed',
        String(colorScheme === 'dark'),
      )
      await page.getByRole('button', { name: 'Dark mode', exact: true }).click()
      await expect(page.locator('html')).toHaveAttribute(
        'data-theme',
        colorScheme === 'dark' ? 'light' : 'dark',
      )
      expect(errors).toEqual([])
    })
  }
}

test('loading, network/schema errors, retry and empty data', async ({ page }) => {
  let mode: 'loading' | 'network' | 'schema' | 'empty' | 'ok' = 'loading'
  let release: (() => void) | undefined
  const waiting = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('**/data/TABLEAU_sector_year.csv', async (route) => {
    if (mode === 'loading') {
      await waiting
      await route.fulfill({ status: 503, body: 'Unavailable' })
      return
    }
    if (mode === 'network') {
      await route.abort()
      return
    }
    if (mode === 'schema') {
      await route.fulfill({ body: '<html>bad data</html>' })
      return
    }
    if (mode === 'empty') {
      await route.fulfill({ body: 'Year,Industry,Sector_Type,Annual_Pct_Adjustment_Avg\n' })
      return
    }
    await route.continue()
  })
  await page.goto('/')
  await expect(page.getByRole('status')).toHaveText('Loading wage observations…')
  await expect(page.getByRole('button', { name: 'Apply filters' })).toBeDisabled()
  release?.()
  await expect(page.getByRole('alert')).toContainText('could not load')
  mode = 'network'
  await page.getByRole('button', { name: 'Retry', exact: true }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  mode = 'schema'
  await page.getByRole('button', { name: 'Retry', exact: true }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  mode = 'ok'
  await page.getByRole('button', { name: 'Retry', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('10 years')
  await page.getByLabel('Industry / source category').selectOption('Manufacturing')
  await page.getByRole('button', { name: 'Apply filters' }).click()
  await expect(page.getByRole('status')).toContainText('Updated period')
  mode = 'empty'
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'No observations for this selection' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'No observations for this selection' }),
  ).toBeVisible()
})

test('missing values, zero, invalid periods and predictable year selection', async ({ page }) => {
  await page.route('**/data/TABLEAU_sector_year.csv', (route) =>
    route.fulfill({
      body: 'Year,Industry,Sector_Type,Annual_Pct_Adjustment_Avg\n2016,All industries,Public Sector,0\n2016,All industries,Private Sector,\n2017,All industries,Public Sector,2\n2017,All industries,Private Sector,1\n',
    }),
  )
  await page.goto('/')
  await expect(page.getByRole('status')).toContainText('2 years')
  await page.getByLabel('Selected year', { exact: true }).selectOption('2016')
  await expect(page.getByRole('region', { name: 'Selected year values' })).toContainText(
    'Public: 0.0% · Private: Not available',
  )
  await page.getByRole('button', { name: 'Apply filters' }).click()
  await expect(page.getByLabel('Selected year', { exact: true })).toHaveValue('2016')
  await page.getByLabel('From year', { exact: true }).selectOption('2017')
  await page.getByLabel('To year', { exact: true }).selectOption('2016')
  await expect(page.getByRole('button', { name: 'Apply filters' })).toBeDisabled()
  await expect(page.getByRole('alert')).toContainText('From year must be')
  await page.getByLabel('To year', { exact: true }).selectOption('2017')
  await page.getByRole('button', { name: 'Apply filters' }).click()
  await expect(page.getByLabel('Selected year', { exact: true })).toHaveValue('2017')
})

test('other five charts and fullscreen remain available', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('button', { name: 'Show other charts' }).click()
  const gallery = page.locator('#legacy-gallery')
  await expect(gallery).toBeVisible()
  await expect(gallery.locator('.swiper-slide')).toHaveCount(5)
  await expect(gallery.locator('canvas').first()).toBeVisible()
  await gallery.getByRole('button', { name: 'Enter Fullscreen' }).click()
  await expect(gallery).toHaveClass('fullscreen')
  await page.keyboard.press('Escape')
  await expect(gallery).not.toHaveClass('fullscreen')
  for (let index = 1; index < 5; index++) {
    await gallery.locator('.swiper-button-next').click()
    await expect(gallery.locator('.swiper-slide').nth(index)).toHaveClass(/swiper-slide-active/)
    await expect(gallery.locator('.swiper-slide-active canvas, .swiper-slide-active .adjustment-comparison svg')).toBeVisible()
  }
  await page.getByRole('button', { name: 'Hide other charts' }).click()
  await expect(gallery).toHaveCount(0)
  expect(await page.locator('body').evaluate((el) => el.style.overflow)).toBe('')
})
