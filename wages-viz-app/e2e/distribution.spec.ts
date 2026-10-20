import { test, expect } from '@playwright/test'
import { openChart, originalRows, noOverflow, sourceRecovery } from './chartHelpers'
const header =
  'Year,Industry,Sector_Type,Annual_Pct_Adjustment_Avg,Number_of_Employees,Number_of_Agreements\n'
for (const width of [320, 1440])
  test(`distribution ${width}px: original quartiles, every overlay, table and year keyboard`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
    const chart = await openChart(page, 0),
      source = await originalRows(page)
    await expect(chart.locator('.distribution-box')).toHaveCount(5)
    await expect(chart.locator('.distribution-point')).toHaveCount(49)
    const boxes = await chart.locator('.distribution-box').evaluateAll((els) =>
      els.map((el) => ({
        name: el.getAttribute('data-industry'),
        values: JSON.parse(el.getAttribute('data-values')!) as number[],
      })),
    )
    for (const box of boxes) {
      const values = source
        .filter(
          (r) =>
            r.Industry === box.name &&
            r.Sector_Type === 'All Sectors' &&
            Number(r.Year) >= 2016 &&
            Number(r.Year) <= 2025,
        )
        .map((r) => r.Annual_Pct_Adjustment_Avg)
        .filter((v): v is number => typeof v === 'number')
        .sort((a, b) => a - b)
      expect(box.values).toEqual([
        values[0],
        values[Math.floor(values.length * 0.25)],
        values[Math.floor(values.length * 0.5)],
        values[Math.floor(values.length * 0.75)],
        values[values.length - 1],
      ])
    }
    const points = await chart.locator('.distribution-point').evaluateAll((els) =>
      els.map((el) => ({
        name: el.getAttribute('data-industry'),
        year: Number(el.getAttribute('data-year')),
        annual: Number(el.getAttribute('data-annual')),
      })),
    )
    for (const point of points)
      expect(point.annual).toBe(
        source.find(
          (r) =>
            r.Industry === point.name && r.Sector_Type === 'All Sectors' && r.Year === point.year,
        )?.Annual_Pct_Adjustment_Avg,
      )
    await chart.getByRole('checkbox', { name: '2025', exact: true }).uncheck()
    await expect(chart.locator('.distribution-point')).toHaveCount(44)
    await chart.getByRole('checkbox', { name: '2025', exact: true }).check()
    await chart.getByRole('combobox', { name: 'Inspect year', exact: true }).selectOption('2024')
    await expect(chart.getByRole('status')).toContainText('Year: 2024')
    await expect(chart.locator('.selected-point')).toHaveCount(5)
    await page.evaluate(() => document.fonts.ready)
    await chart.screenshot({ path: `docs/design/screens/distribution-${width}-dark-chart.png` })
    await chart.getByRole('button', { name: 'Table', exact: true }).focus()
    await page.keyboard.press('Enter')
    await expect(chart.locator('tbody tr')).toHaveCount(54)
    const actual = await chart
      .locator('tbody tr')
      .evaluateAll((rows) =>
        rows.map((row) =>
          [...row.querySelectorAll('.cell-value')].map((el) => el.textContent?.trim()),
        ),
      )
    expect(actual.slice(0, 5).map((row) => row.slice(4).map(Number))).toEqual(
      boxes.map((b) => b.values),
    )
    for (const point of points) {
      const row = chart.locator('tbody tr').filter({
        has: page.getByRole('button', { name: `${point.name} · ${point.year}`, exact: true }),
      })
      await expect(row.locator('.cell-value').nth(1)).toHaveText(
        String(Number(point.annual.toFixed(2))),
      )
    }
    await chart.screenshot({ path: `docs/design/screens/distribution-${width}-dark-table.png` })
    await noOverflow(page)
    await page.locator('#legacy-gallery').getByRole('button', { name: 'Enter Fullscreen' }).click()
    await expect(chart).toHaveClass(/expanded/)
    await page.keyboard.press('Escape')
    await expect(chart).not.toHaveClass(/expanded/)
  })

test('distribution HTTP/schema/empty source states recover', async ({ page }) => {
  const chart = await sourceRecovery(page, 0, header, 'No wage distribution data available.')
  await expect(chart.locator('.distribution-point')).toHaveCount(49)
})

test('distribution missing/zero/negative source values keep category identity and indexed quartiles', async ({
  page,
}) => {
  await page.route('**/data/TABLEAU_sector_year.csv', (route) =>
    route.fulfill({
      body:
        header +
        '2020,Manufacturing,All Sectors,,0,0\n2021,Manufacturing,All Sectors,-2,0,0\n2022,Manufacturing,All Sectors,0,,\n2023,Manufacturing,All Sectors,4,10,1\n2024,Manufacturing,All Sectors,8,20,2\n',
    }),
  )
  const chart = await openChart(page, 0)
  await expect(chart.locator('.distribution-box')).toHaveAttribute('data-industry', 'Manufacturing')
  await expect(chart.locator('.distribution-box')).toHaveAttribute('data-values', '[-2,0,4,8,8]')
  await expect(chart.locator('.distribution-point')).toHaveCount(4)
  await chart.getByRole('button', { name: 'Table', exact: true }).click()
  const missing = chart
    .locator('tbody tr')
    .filter({ has: page.getByRole('button', { name: 'Manufacturing · 2020', exact: true }) })
  await expect(missing.locator('.cell-value').nth(1)).toHaveText('Not available')
  const zero = chart
    .locator('tbody tr')
    .filter({ has: page.getByRole('button', { name: 'Manufacturing · 2022', exact: true }) })
  await expect(zero.locator('.cell-value').nth(1)).toHaveText('0')
  await expect(zero.locator('.cell-value').nth(2)).toHaveText('Not available')
})
