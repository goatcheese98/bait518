import { test, expect } from '@playwright/test'
import { openChart } from './chartHelpers'
const header =
  'Year,Industry,Sector_Type,Duration_Months_Avg,Annual_Pct_Adjustment_Avg,First_Year_Pct_Adjustment_Avg,Number_of_Agreements,Number_of_Employees\n'
const fixtures = [
  {
    name: 'all-negative',
    values: [
      [12, -2],
      [24, -2],
    ],
  },
  {
    name: 'mixed-negative-positive',
    values: [
      [12, -2],
      [24, 3],
    ],
  },
  {
    name: 'equal-value',
    values: [
      [12, 2],
      [12, 2],
    ],
  },
  {
    name: 'very-large-finite',
    values: [
      [1e20, 1e20],
      [1e20, 1e20],
    ],
  },
]
for (const fixture of fixtures)
  test(`duration geometry ${fixture.name}: finite ordered visible coordinates and honest table`, async ({
    page,
  }) => {
    await page.route('**/data/TABLEAU_sector_year.csv', (route) =>
      route.fulfill({
        body:
          header +
          fixture.values
            .map(
              ([duration, annual], i) =>
                `2023,${i === 0 ? 'Construction' : 'Manufacturing'},All Sectors,${duration},${annual},1,1,10`,
            )
            .join('\n') +
          '\n',
      }),
    )
    // The helper navigates gallery index 2; duration retains its existing section.
    await openChart(page, 2)
    const chart = page.locator('.duration-comparison')
    await expect(chart.locator('.duration-point')).toHaveCount(2)
    const coordinates = await chart
      .locator('.duration-point')
      .evaluateAll((els) =>
        els.map((el) => ['cx', 'cy', 'r'].map((key) => Number(el.getAttribute(key)))),
      )
    for (const [cx, cy, r] of coordinates) {
      expect(Number.isFinite(cx) && Number.isFinite(cy) && Number.isFinite(r)).toBe(true)
      expect(cx).toBeGreaterThanOrEqual(72)
      expect(cx).toBeLessThanOrEqual(582)
      expect(cy).toBeGreaterThanOrEqual(60)
      expect(cy).toBeLessThanOrEqual(310)
      expect(r).toBeGreaterThanOrEqual(9)
      expect(r).toBeLessThanOrEqual(32.5)
    }
    const attributes = await chart
      .locator('svg line, svg rect, svg circle, svg text')
      .evaluateAll((els) =>
        els.flatMap((el) =>
          ['x', 'y', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy', 'r', 'width', 'height']
            .filter((key) => el.hasAttribute(key))
            .map((key) => Number(el.getAttribute(key))),
        ),
      )
    expect(attributes.every(Number.isFinite)).toBe(true)
    await chart.getByRole('button', { name: 'Table', exact: true }).click()
    const cells = await chart
      .locator('tbody tr')
      .evaluateAll((rows) =>
        rows.map((row) =>
          [...row.querySelectorAll('.cell-value')].slice(0, 2).map((el) => Number(el.textContent)),
        ),
      )
    expect(cells).toEqual(fixture.values)
  })

test('duration unsupported range is actionable and retry restores production geometry', async ({
  page,
}) => {
  let bad = true
  await page.route('**/data/TABLEAU_sector_year.csv', async (route) => {
    if (bad)
      await route.fulfill({
        body: header + '2023,Construction,All Sectors,1.7976931348623157e308,1,1,1,1\n',
      })
    else await route.continue()
  })
  await openChart(page, 2)
  const chart = page.locator('.duration-comparison')
  await expect(chart.getByRole('alert')).toContainText('Unsupported plot range')
  await expect(chart.getByRole('alert')).toContainText('reduce the selected period')
  await expect(chart.locator('svg')).toHaveCount(0)
  bad = false
  await chart.getByRole('button', { name: 'Retry duration data' }).click()
  await expect(chart.locator('.duration-point')).toHaveCount(11)
  const coordinates = await chart
    .locator('.duration-point')
    .evaluateAll((els) =>
      els.flatMap((el) => ['cx', 'cy', 'r'].map((k) => Number(el.getAttribute(k)))),
    )
  expect(coordinates.every(Number.isFinite)).toBe(true)
})

for (const fixture of fixtures.filter(
  (f) => f.name === 'all-negative' || f.name === 'mixed-negative-positive',
))
  test(`duration negative baseline ${fixture.name}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 1000 })
    await page.route('**/data/TABLEAU_sector_year.csv', (route) =>
      route.fulfill({
        body:
          header +
          fixture.values
            .map(
              ([duration, annual], i) =>
                `2023,${i === 0 ? 'Construction' : 'Manufacturing'},All Sectors,${duration},${annual},1,1,10`,
            )
            .join('\n') +
          '\n',
      }),
    )
    await openChart(page, 2)
    const chart = page.locator('.duration-comparison')
    await expect(chart.locator('.duration-zero')).toHaveCount(1)
    const baseline = Number(await chart.locator('.duration-zero').getAttribute('y1'))
    expect(baseline).toBeGreaterThanOrEqual(60)
    expect(baseline).toBeLessThanOrEqual(310)
    const negative = Number(await chart.locator('.duration-point').first().getAttribute('cy'))
    expect(negative).toBeGreaterThan(baseline)
    await chart.screenshot({
      path: `docs/design/screens/duration-geometry-${fixture.name}-320.png`,
    })
  })
