import { expect, type Page } from '@playwright/test'
import Papa from 'papaparse'
export async function openChart(page: Page, index: number) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Show other charts' }).click()
  const gallery = page.locator('#legacy-gallery')
  for (let i = 1; i <= index; i++) {
    await gallery.locator('.swiper-button-next').click()
    await expect(gallery.locator('.swiper-slide').nth(i)).toHaveClass(/swiper-slide-active/)
  }
  return gallery.locator('.swiper-slide-active .chart-frame')
}
export async function originalRows(page: Page) {
  const response = await page.request.get('/data/TABLEAU_sector_year.csv')
  expect(response.ok()).toBe(true)
  return Papa.parse<Record<string, unknown>>(await response.text(), {
    header: true,
    dynamicTyping: true,
  }).data
}
export async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
}
export async function sourceRecovery(page: Page, index: number, header: string, empty: string) {
  let stage = 0
  await page.route('**/data/TABLEAU_sector_year.csv', async (route) => {
    if (stage === 0) await route.fulfill({ status: 503, body: 'Unavailable' })
    else if (stage === 1) await route.fulfill({ body: 'bad,columns\n1,2' })
    else if (stage === 2) await route.fulfill({ body: header })
    else await route.continue()
  })
  const chart = await openChart(page, index)
  await expect(chart.getByRole('alert')).toContainText('could not load')
  await expect(chart.getByRole('button', { name: 'Table', exact: true })).toBeDisabled()
  stage = 1
  await chart.getByRole('button', { name: 'Retry data', exact: true }).click()
  await expect(chart.getByRole('alert')).toBeVisible()
  stage = 2
  await chart.getByRole('button', { name: 'Retry data', exact: true }).click()
  await expect(chart.getByRole('heading', { name: empty, exact: true })).toBeVisible()
  stage = 3
  await chart.getByRole('button', { name: 'Reload data', exact: true }).click()
  await expect(chart.getByRole('img')).toBeVisible()
  return chart
}
