import { test, expect, type Page } from '@playwright/test'
import Papa from 'papaparse'
async function openDuration(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Show other charts' }).click()
  const gallery = page.locator('#legacy-gallery')
  for (let i = 1; i <= 2; i++) {
    await gallery.locator('.swiper-button-next').click()
    await expect(gallery.locator('.swiper-slide').nth(i)).toHaveClass(/swiper-slide-active/)
  }
  return page.locator('.duration-comparison')
}
for (const width of [320, 1440])
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`duration ${width}px ${colorScheme}: original output, table, keyboard and year parity`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' })
      const chart = await openDuration(page)
      await expect(chart.locator('.duration-point')).toHaveCount(11)
      const response = await page.request.get('/data/TABLEAU_sector_year.csv')
      const original = Papa.parse<Record<string, string | number>>(await response.text(), {
        header: true,
        dynamicTyping: true,
      }).data
      const marks = await chart.locator('.duration-point').evaluateAll((elements) =>
        elements.map((el) => ({
          name: el.getAttribute('data-industry'),
          values: ['duration', 'annual', 'first-year', 'agreements', 'employees'].map((key) =>
            Number(el.getAttribute(`data-${key}`)),
          ),
          radius: Number(el.getAttribute('r')),
        })),
      )
      for (const mark of marks) {
        const rows = original.filter(
          (r) =>
            r.Industry === mark.name &&
            r.Sector_Type === 'All Sectors' &&
            [2023, 2024, 2025].includes(Number(r.Year)),
        )
        const sum = (key: string) => rows.reduce((n, r) => n + (Number(r[key]) || 0), 0)
        expect(mark.values).toEqual([
          Number((sum('Duration_Months_Avg') / rows.length).toFixed(1)),
          Number((sum('Annual_Pct_Adjustment_Avg') / rows.length).toFixed(2)),
          Number((sum('First_Year_Pct_Adjustment_Avg') / rows.length).toFixed(2)),
          Math.round(sum('Number_of_Agreements')),
          Math.round(sum('Number_of_Employees')),
        ])
        expect(mark.radius).toBeGreaterThanOrEqual(9)
        expect(mark.radius).toBeLessThanOrEqual(32.5)
      }
      await chart.getByRole('checkbox', { name: 'Other industries', exact: true }).uncheck()
      await expect(chart.locator('.duration-point')).toHaveCount(2)
      await chart.getByRole('checkbox', { name: 'Other industries', exact: true }).check()
      await page.evaluate(() => document.fonts.ready)
      await chart.screenshot({
        path: `docs/design/screens/duration-${width}-${colorScheme}-chart.png`,
      })
      await chart.getByRole('button', { name: 'Table', exact: true }).focus()
      await page.keyboard.press('Enter')
      const table = await chart.locator('tbody tr').evaluateAll((rows) =>
        rows.map((row) => ({
          name: row.querySelector('th')?.textContent?.trim(),
          values: [...row.querySelectorAll('.cell-value')].map((td) => Number(td.textContent)),
        })),
      )
      expect(table).toEqual(marks.map((mark) => ({ name: mark.name, values: [...mark.values, 0] })))
      await chart.getByLabel('Duration period', { exact: true }).selectOption('2024')
      await chart.getByRole('button', { name: 'Chart', exact: true }).click()
      await expect(chart.locator('.duration-point')).toHaveCount(11)
      const construction = original.find(
        (r) => r.Industry === 'Construction' && r.Sector_Type === 'All Sectors' && r.Year === 2024,
      )!
      await expect(chart.locator('.duration-point[data-industry="Construction"]')).toHaveAttribute(
        'data-annual',
        String(Number(Number(construction.Annual_Pct_Adjustment_Avg).toFixed(2))),
      )
      await chart.getByRole('button', { name: 'Table', exact: true }).click()
      await chart.screenshot({
        path: `docs/design/screens/duration-${width}-${colorScheme}-table.png`,
      })
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true)
      await page
        .locator('#legacy-gallery')
        .getByRole('button', { name: 'Enter Fullscreen' })
        .click()
      await expect(chart).toHaveClass(/expanded/)
      await page.keyboard.press('Escape')
      await expect(chart).not.toHaveClass(/expanded/)
    })
  }

test('duration HTTP/schema errors recover on retry', async ({ page }) => {
  let stage = 0
  await page.route('**/data/TABLEAU_sector_year.csv', async (route) => {
    if (stage === 0) await route.fulfill({ status: 503, body: 'Unavailable' })
    else if (stage === 1) await route.fulfill({ body: 'bad,columns\n1,2' })
    else await route.continue()
  })
  const chart = await openDuration(page)
  await expect(chart.getByRole('alert')).toContainText('could not load')
  await expect(chart.getByRole('button', { name: 'Table', exact: true })).toBeDisabled()
  stage = 1
  await chart.getByRole('button', { name: 'Retry duration data' }).click()
  await expect(chart.getByRole('alert')).toBeVisible()
  stage = 2
  await chart.getByRole('button', { name: 'Retry duration data' }).click()
  await expect(chart.locator('.duration-point')).toHaveCount(11)
})

test('duration empty state and missing-versus-zero source accounting', async ({ page }) => {
  const header =
    'Year,Industry,Sector_Type,Duration_Months_Avg,Annual_Pct_Adjustment_Avg,First_Year_Pct_Adjustment_Avg,Number_of_Agreements,Number_of_Employees\n'
  let empty = true
  await page.route('**/data/TABLEAU_sector_year.csv', (route) =>
    route.fulfill({ body: header + (empty ? '' : '2023,Construction,All Sectors,,0,-1,0,0\n') }),
  )
  const chart = await openDuration(page)
  await expect(
    chart.getByRole('heading', { name: 'No duration data available for the selected period.' }),
  ).toBeVisible()
  empty = false
  await chart.getByRole('button', { name: 'Reload duration data' }).click()
  await expect(chart.locator('.duration-point')).toHaveCount(1)
  await chart.getByLabel('Inspect industry', { exact: true }).selectOption('Construction')
  await expect(chart.getByRole('status')).toContainText('1 missing source fields')
  await chart.getByRole('button', { name: 'Table', exact: true }).click()
  await expect(chart.locator('.cell-value')).toHaveText(['0', '0', '-1', '0', '0', '1'])
})
