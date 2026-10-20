import { test, expect } from '@playwright/test'
import { openChart } from './chartHelpers'
const header =
  'Year,Industry,Sector_Type,Duration_Months_Avg,Annual_Pct_Adjustment_Avg,First_Year_Pct_Adjustment_Avg,Number_of_Agreements,Number_of_Employees\n'
for (const chartCase of [
  { name: 'duration', index: 2, category: 'Construction', selector: '.duration-comparison' },
  {
    name: 'regional',
    index: 4,
    category: 'Ontario',
    selector: '.swiper-slide-active .chart-frame',
  },
  {
    name: 'distribution',
    index: 0,
    category: 'Manufacturing',
    selector: '.swiper-slide-active .chart-frame',
  },
])
  test(`${chartCase.name} extreme negative axis text is finite and source/retry stays honest`, async ({
    page,
  }) => {
    let stage = 0
    await page.route('**/data/TABLEAU_sector_year.csv', async (route) => {
      if (stage === 0)
        await route.fulfill({
          body: header + `2023,${chartCase.category},All Sectors,12,-1e308,1,1,10\n`,
        })
      else if (stage === 1) await route.fulfill({ status: 503, body: 'Unavailable' })
      else await route.continue()
    })
    await openChart(page, chartCase.index)
    const chart = page.locator(chartCase.selector)
    await expect(chart.getByRole('img')).toBeVisible()
    const labels = await chart.locator('svg text').allTextContents()
    expect(labels.join(' ')).not.toMatch(/NaN|Infinity/)
    const attrs = await chart
      .locator('svg circle,svg line,svg rect')
      .evaluateAll((els) =>
        els.flatMap((el) =>
          ['cx', 'cy', 'r', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'width', 'height']
            .filter((key) => el.hasAttribute(key))
            .map((key) => Number(el.getAttribute(key))),
        ),
      )
    expect(attrs.every(Number.isFinite)).toBe(true)
    await chart.getByRole('button', { name: 'Table', exact: true }).click()
    await expect(chart.getByRole('table')).toContainText('-1e+308')
    stage = 1
    await openChart(page, chartCase.index)
    await page.locator(chartCase.selector).waitFor({ state: 'attached' })
    await expect(chart.getByRole('alert')).toContainText('could not load')
    stage = 2
    await chart.getByRole('button', { name: /Retry/ }).click()
    await expect(chart.getByRole('img')).toBeVisible()
    expect((await chart.locator('svg text').allTextContents()).join(' ')).not.toMatch(
      /NaN|Infinity/,
    )
  })
