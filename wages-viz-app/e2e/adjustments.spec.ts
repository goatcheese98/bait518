import { test, expect, type Page } from './runtimeFixtures'

async function openComparison(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Show other charts' }).click()
  const gallery = page.locator('#legacy-gallery')
  for (let index = 1; index <= 3; index++) {
    await gallery.locator('.swiper-button-next').click()
    await expect(gallery.locator('.swiper-slide').nth(index)).toHaveClass(/swiper-slide-active/)
  }
  return gallery.locator('.swiper-slide').nth(3)
}

test('first-year chart provides a source table alternative', async ({ page }) => {
  const slide = await openComparison(page)
  await expect(slide.getByRole('button', { name: 'Table', exact: true })).toBeVisible()
  await slide.getByRole('button', { name: 'Table', exact: true }).click()
  await expect(slide.getByRole('table')).toBeVisible()
  await expect(slide.getByRole('row', { name: /2016 0.9% 1.4% -0.5 pp/ })).toBeVisible()
})

async function captureComparison(page: Page, width: number, theme: string, state: string) {
  if (width === 320 || width === 1440) {
    await page.evaluate(() => document.fonts.ready)
    await page.locator('.adjustment-comparison').evaluate((el) => {
      el.scrollTop = 0
    })
    await page
      .locator('.swiper-slide-active .modern-chart-card')
      .screenshot({ path: `docs/design/screens/adjustments-${width}-${theme}-${state}.png` })
  }
}

for (const width of [320, 768, 1024, 1440]) {
  for (const colorScheme of ['light', 'dark'] as const) {
    // A context preference survives Firefox's COOP browsing-context switch.
    test.describe(`${width}px ${colorScheme} browser preference`, () => {
      test.use({ colorScheme })

      test(`first-year ${width}px ${colorScheme}: chart/table equivalence and keyboard`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 1000 })
        await page.emulateMedia({ reducedMotion: 'reduce' })
        const slide = await openComparison(page)
        const comparison = slide.getByRole('region', {
          name: 'First-year vs annual adjustments',
          exact: true,
        })
        await expect(comparison.getByRole('status')).toContainText('2025 comparison')
        const source = await page.request.get('/data/TABLEAU_sector_year.csv')
        const csv = await source.text()
        // Independent source extraction: the production CSV has quoted categories elsewhere,
        // but the selected All industries aggregate rows contain no quoted fields.
        const expected = csv
          .trim()
          .split('\n')
          .slice(1)
          .map((line) => line.split(','))
          .filter((row) => row[1] === 'All industries' && row[2] === 'All Sectors')
          .map((row) => ({ year: Number(row[0]), firstYear: Number(row[6]), annual: Number(row[7]) }))
        expect(expected).toHaveLength(10)
        const marks = await comparison.locator('.adjustment-bar').evaluateAll((elements) =>
          elements.map((el) => ({
            year: Number(el.getAttribute('data-year')),
            series: el.getAttribute('data-series'),
            value: Number(el.getAttribute('data-value')),
          })),
        )
        expect(marks).toEqual(
          expected.flatMap((row) => [
            { year: row.year, series: 'firstYear', value: row.firstYear },
            { year: row.year, series: 'annual', value: row.annual },
          ]),
        )
        await comparison.getByRole('checkbox', { name: 'Annual average', exact: true }).uncheck()
        await expect(comparison.locator('.adjustment-bar.annual')).toHaveCount(0)
        await comparison.getByRole('checkbox', { name: 'Annual average', exact: true }).check()
        await expect(comparison.locator('.adjustment-bar.annual')).toHaveCount(10)
        expect(await comparison.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
          colorScheme === 'dark' ? 'rgb(10, 10, 11)' : 'rgb(255, 255, 255)',
        )
        expect(
          await comparison
            .locator('.adjustment-bar')
            .first()
            .evaluate((el) => getComputedStyle(el).animationName),
        ).toBe('none')
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        ).toBe(true)
        await expect
          .poll(() =>
            comparison
              .locator('.adjustment-bar[data-year="2025"]')
              .first()
              .evaluate((el) => {
                const bar = el.getBoundingClientRect(),
                  region = el.closest('.comparison-scroll')!.getBoundingClientRect()
                return bar.left >= region.left && bar.right <= region.right
              }),
          )
          .toBe(true)
        await captureComparison(page, width, colorScheme, 'chart')
        await comparison.getByRole('button', { name: 'Table', exact: true }).focus()
        await page.keyboard.press('Enter')
        await expect(comparison.getByRole('button', { name: 'Table', exact: true })).toHaveAttribute(
          'aria-pressed',
          'true',
        )
        const actualTable = await comparison.locator('tbody tr').evaluateAll((elements) =>
          elements.map((el) => ({
            year: Number(el.querySelector('th')?.textContent?.trim()),
            values: [...el.querySelectorAll('td')].map((td) =>
              parseFloat(td.querySelector('.cell-value')?.textContent ?? ''),
            ),
          })),
        )
        expect(actualTable).toEqual(
          expected.map((row) => ({
            year: row.year,
            values: [row.firstYear, row.annual, Number((row.firstYear - row.annual).toFixed(2))],
          })),
        )
        await comparison
          .getByRole('button', { name: 'Inspect comparison year 2016', exact: true })
          .focus()
        await page.keyboard.press('Enter')
        await expect(comparison.getByLabel('Comparison year', { exact: true })).toHaveValue('2016')
        await expect(comparison.getByRole('status')).toContainText('Gap: -0.5 pp')
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        ).toBe(true)
        await captureComparison(page, width, colorScheme, 'table')
        await slide.locator('.comparison-scroll').focus()
        await expect(slide.locator('.comparison-scroll')).toBeFocused()
        await page
          .locator('#legacy-gallery')
          .getByRole('button', { name: 'Enter Fullscreen' })
          .click()
        await expect(comparison).toHaveClass(/expanded/)
        await page.keyboard.press('Escape')
        await expect(comparison).not.toHaveClass(/expanded/)
      })
    })
  }
}

test('first-year missing, zero and negative observations remain distinct in plot and table', async ({
  page,
}) => {
  await page.route('**/data/TABLEAU_sector_year.csv', (route) =>
    route.fulfill({
      body: 'Year,Industry,Sector_Type,First_Year_Pct_Adjustment_Avg,Annual_Pct_Adjustment_Avg\n2020,All industries,All Sectors,0,\n2021,All industries,All Sectors,-1.25,0\n',
    }),
  )
  const slide = await openComparison(page)
  const comparison = slide.locator('.adjustment-comparison')
  await expect(comparison.locator('.adjustment-bar')).toHaveCount(3)
  await expect(comparison.locator('.zero-value')).toHaveCount(2)
  await expect(comparison.locator('.adjustment-bar[data-value="-1.25"]')).toHaveAttribute(
    'height',
    /[1-9]/,
  )
  await comparison.getByRole('button', { name: 'Table', exact: true }).click()
  await expect(
    comparison.getByRole('row', { name: /2020 0.0% Not available Not available/ }),
  ).toBeVisible()
  await expect(comparison.getByRole('row', { name: /2021 -1.25% 0.0% -1.25 pp/ })).toBeVisible()
})

test('first-year HTTP/schema failure is visible and retry restores source observations', async ({
  page,
}) => {
  let stage = 0
  await page.route('**/data/TABLEAU_sector_year.csv', async (route) => {
    if (stage === 0) await route.fulfill({ status: 503, body: 'Unavailable' })
    else if (stage === 1) await route.fulfill({ body: 'bad,columns\n1,2' })
    else await route.continue()
  })
  const slide = await openComparison(page)
  const comparison = slide.locator('.adjustment-comparison')
  await expect(comparison.getByRole('alert')).toContainText('could not load')
  await expect(comparison.getByRole('button', { name: 'Table', exact: true })).toBeDisabled()
  stage = 1
  await comparison.getByRole('button', { name: 'Retry first-year data' }).click()
  await expect(comparison.getByRole('alert')).toBeVisible()
  stage = 2
  await comparison.getByRole('button', { name: 'Retry first-year data' }).click()
  await expect(comparison.getByRole('status')).toContainText('2025 comparison')
  await expect(comparison.locator('.adjustment-bar')).toHaveCount(20)
})

test('first-year valid empty data has an explicit empty state', async ({ page }) => {
  await page.route('**/data/TABLEAU_sector_year.csv', (route) =>
    route.fulfill({
      body: 'Year,Industry,Sector_Type,First_Year_Pct_Adjustment_Avg,Annual_Pct_Adjustment_Avg\n',
    }),
  )
  const slide = await openComparison(page)
  await expect(
    slide.getByRole('heading', { name: 'No aggregate observations available' }),
  ).toBeVisible()
  await expect(slide.getByRole('button', { name: 'Table', exact: true })).toBeDisabled()
  await slide.getByRole('button', { name: 'Reload first-year data' }).click()
  await expect(
    slide.getByRole('heading', { name: 'No aggregate observations available' }),
  ).toBeVisible()
})
