import { test, expect } from '@playwright/test'
import { openChart, originalRows, noOverflow, sourceRecovery } from './chartHelpers'
const header =
  'Year,Industry,Sector_Type,Annual_Pct_Adjustment_Avg,First_Year_Pct_Adjustment_Avg,Number_of_Employees\n'
for (const width of [320, 1440])
  test(`leaders ${width}px: original ranked output, source table and year keyboard`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
    const chart = await openChart(page, 1),
      source = await originalRows(page)
    await expect(chart.locator('.leader-bar')).toHaveCount(8)
    const marks = await chart.locator('.leader-bar').evaluateAll((elements) =>
      elements.map((el) => ({
        name: el.getAttribute('data-industry'),
        values: ['annual', 'first-year', 'latest-year', 'employees'].map((key) =>
          Number(el.getAttribute(`data-${key}`)),
        ),
      })),
    )
    for (const mark of marks) {
      const rows = source.filter(
        (r) =>
          r.Industry === mark.name &&
          r.Sector_Type === 'All Sectors' &&
          [2023, 2024, 2025].includes(Number(r.Year)),
      )
      const avg = (key: string) => {
        const values = rows.map((r) => r[key]).filter((v): v is number => typeof v === 'number')
        return Number((values.reduce((n, v) => n + v, 0) / values.length).toFixed(2))
      }
      expect(mark.values).toEqual([
        avg('Annual_Pct_Adjustment_Avg'),
        avg('First_Year_Pct_Adjustment_Avg'),
        2025,
        Math.round(rows.reduce((n, r) => n + Number(r.Number_of_Employees), 0)),
      ])
    }
    expect(marks.map((m) => m.values[0])).toEqual(
      marks.map((m) => m.values[0]).sort((a, b) => Number(b) - Number(a)),
    )
    await page.evaluate(() => document.fonts.ready)
    await chart.screenshot({ path: `docs/design/screens/leaders-${width}-dark-chart.png` })
    await chart.getByRole('button', { name: 'Table', exact: true }).focus()
    await page.keyboard.press('Enter')
    const values = await chart
      .locator('tbody tr')
      .evaluateAll((rows) =>
        rows.map((row) =>
          [...row.querySelectorAll('.cell-value')].map((el) => Number(el.textContent)),
        ),
      )
    expect(values).toEqual(marks.map((m) => [...m.values, 0]))
    await chart.getByLabel('Industry period', { exact: true }).selectOption('2024')
    await expect(chart.getByRole('status')).toContainText('Latest Year Observed: 2024')
    await chart.screenshot({ path: `docs/design/screens/leaders-${width}-dark-table.png` })
    await noOverflow(page)
    await page.locator('#legacy-gallery').getByRole('button', { name: 'Enter Fullscreen' }).click()
    await expect(chart).toHaveClass(/expanded/)
    await page.keyboard.press('Escape')
    await expect(chart).not.toHaveClass(/expanded/)
  })
test('leaders HTTP/schema/empty source states recover', async ({ page }) => {
  const chart = await sourceRecovery(
    page,
    1,
    header,
    'No industry-level data available for the selected period.',
  )
  await expect(chart.locator('.leader-bar')).toHaveCount(8)
})
test('leaders keeps missing-versus-zero mean semantics', async ({ page }) => {
  await page.route('**/data/TABLEAU_sector_year.csv', (route) =>
    route.fulfill({
      body: header + '2023,Construction,All Sectors,,0,0\n2024,Construction,All Sectors,4,2,10\n',
    }),
  )
  const chart = await openChart(page, 1)
  await expect(chart.locator('.leader-bar')).toHaveAttribute('data-annual', '4')
  await chart.getByRole('button', { name: 'Table', exact: true }).click()
  await expect(chart.locator('.cell-value')).toHaveText(['4', '1', '2024', '10', '1'])
})
