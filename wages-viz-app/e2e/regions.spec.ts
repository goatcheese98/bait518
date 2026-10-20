import { test, expect } from '@playwright/test'
import { openChart, originalRows, noOverflow, sourceRecovery } from './chartHelpers'
const header =
  'Year,Industry,Sector_Type,Annual_Pct_Adjustment_Avg,First_Year_Pct_Adjustment_Avg,Number_of_Employees,Number_of_Agreements\n'
for (const width of [320, 1440])
  test(`regions ${width}px: original series, table, period and keyboard parity`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
    const chart = await openChart(page, 4),
      source = await originalRows(page)
    await expect(chart.locator('.regional-point')).toHaveCount(11)
    const marks = await chart
      .locator('.regional-point')
      .evaluateAll((els) =>
        els.map((el) => ({
          name: el.getAttribute('data-region'),
          values: ['annual', 'first-year', 'employees', 'total', 'agreements'].map((key) =>
            Number(el.getAttribute(`data-${key}`)),
          ),
          r: Number(el.getAttribute('r')),
        })),
      )
    for (const mark of marks) {
      const rows = source.filter(
        (r) =>
          r.Industry === mark.name &&
          r.Sector_Type === 'All Sectors' &&
          Number(r.Year) >= 2016 &&
          Number(r.Year) <= 2025,
      )
      const sum = (key: string) => rows.reduce((n, r) => n + Number(r[key]), 0)
      expect(mark.values).toEqual([
        Number((sum('Annual_Pct_Adjustment_Avg') / rows.length).toFixed(2)),
        sum('First_Year_Pct_Adjustment_Avg') / rows.length,
        sum('Number_of_Employees') / rows.length,
        sum('Number_of_Employees'),
        sum('Number_of_Agreements'),
      ])
      expect(mark.r).toBeGreaterThanOrEqual(9)
      expect(mark.r).toBeLessThanOrEqual(35)
    }
    expect(marks.slice(0, 4).map((m) => m.name)).toEqual([
      'British Columbia',
      'Ontario',
      'Quebec',
      'Alberta',
    ])
    await chart.getByRole('checkbox', { name: 'Other provinces', exact: true }).uncheck()
    await expect(chart.locator('.regional-point')).toHaveCount(4)
    await chart.getByRole('checkbox', { name: 'Other provinces', exact: true }).check()
    await page.evaluate(() => document.fonts.ready)
    await chart.screenshot({ path: `docs/design/screens/regions-${width}-light-chart.png` })
    await chart.getByRole('button', { name: 'Table', exact: true }).focus()
    await page.keyboard.press('Enter')
    const table = await chart
      .locator('tbody tr')
      .evaluateAll((rows) =>
        rows.map((row) =>
          [...row.querySelectorAll('.cell-value')].map((el) => Number(el.textContent)),
        ),
      )
    expect(table).toEqual(
      marks.map((m) => [
        m.values[0],
        Number(m.values[1]!.toFixed(2)),
        ...m.values.slice(2).map(Math.round),
        0,
      ]),
    )
    await chart.getByRole('combobox', { name: 'Regional period', exact: true }).selectOption('2024')
    await chart
      .getByRole('combobox', { name: 'Inspect region', exact: true })
      .selectOption('Ontario')
    await expect(chart.getByRole('status')).toContainText('Agreements Signed (2024)')
    await chart.screenshot({ path: `docs/design/screens/regions-${width}-light-table.png` })
    await noOverflow(page)
  })
test('regions HTTP/schema/empty source states recover', async ({ page }) => {
  const chart = await sourceRecovery(
    page,
    4,
    header,
    'No regional data available for the selected period.',
  )
  await expect(chart.locator('.regional-point')).toHaveCount(11)
})
test('regions preserves missing/zero/negative values with finite visible coordinates', async ({
  page,
}) => {
  await page.route('**/data/TABLEAU_sector_year.csv', (route) =>
    route.fulfill({
      body: header + '2023,Ontario,All Sectors,,0,0,0\n2024,Ontario,All Sectors,-2,2,10,2\n',
    }),
  )
  const chart = await openChart(page, 4)
  await expect(chart.locator('.regional-point')).toHaveAttribute('data-annual', '-1')
  const coordinates = await chart
    .locator('.regional-point')
    .evaluate((el) => ['cx', 'cy', 'r'].map((key) => Number(el.getAttribute(key))))
  expect(coordinates.every(Number.isFinite)).toBe(true)
  expect(coordinates[1]).toBeGreaterThanOrEqual(60)
  expect(coordinates[1]).toBeLessThanOrEqual(310)
  await chart.getByRole('button', { name: 'Table', exact: true }).click()
  await expect(chart.locator('.cell-value')).toHaveText(['-1.00', '1.00', '5', '10', '2', '1'])
})
