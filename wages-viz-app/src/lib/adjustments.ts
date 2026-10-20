import { settlementRows } from './settlementCsv'

export interface AnnualAdjustment {
  year: number
  firstYear: number | null
  annual: number | null
  gap: number | null
}

export function parseAnnualAdjustments(text: string): AnnualAdjustment[] {
  const rows = settlementRows(text, [
    'Year',
    'Industry',
    'Sector_Type',
    'First_Year_Pct_Adjustment_Avg',
    'Annual_Pct_Adjustment_Avg',
  ])
  const result: AnnualAdjustment[] = []
  const seen = new Set<string>()
  const percentage = (value: unknown): number | null => {
    if (typeof value !== 'string') throw new Error('Missing percentage field')
    if (value.trim() === '') return null
    const number = Number(value)
    if (!Number.isFinite(number)) throw new Error('Invalid percentage')
    return number
  }
  for (const row of rows) {
    if (
      typeof row.Year !== 'string' ||
      !/^\d{4}$/.test(row.Year) ||
      typeof row.Industry !== 'string' ||
      !row.Industry.trim() ||
      !['All Sectors', 'Public Sector', 'Private Sector'].includes(String(row.Sector_Type))
    )
      throw new Error('Invalid observation')
    const key = JSON.stringify([row.Year, row.Industry, row.Sector_Type])
    if (seen.has(key)) throw new Error('Duplicate observation')
    seen.add(key)
    const firstYear = percentage(row.First_Year_Pct_Adjustment_Avg)
    const annual = percentage(row.Annual_Pct_Adjustment_Avg)
    if (row.Industry === 'All industries' && row.Sector_Type === 'All Sectors') {
      result.push({
        year: Number(row.Year),
        firstYear,
        annual,
        gap: firstYear === null || annual === null ? null : firstYear - annual,
      })
    }
  }
  const values = result
    .flatMap((row) => [row.firstYear, row.annual])
    .filter((value): value is number => value !== null)
  if (!Number.isFinite(Math.max(0, ...values) - Math.min(0, ...values))) {
    throw new Error('Adjustment range exceeds finite arithmetic')
  }
  return result.sort((a, b) => a.year - b.year)
}

const numeric = new Intl.NumberFormat('en-CA', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
})
export const adjustmentPercent = (value: number | null): string =>
  value === null ? 'Not available' : `${numeric.format(value)}%`
export const adjustmentGap = (value: number | null): string => {
  if (value === null) return 'Not available'
  const displayed = Number(value.toFixed(2))
  return `${displayed > 0 ? '+' : ''}${numeric.format(displayed === 0 ? 0 : displayed)} pp`
}
