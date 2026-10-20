import { settlementRows } from './settlementCsv'

export const durationIndustries = [
  'Construction',
  'Education, health, and social services',
  'Entertainment and hospitality',
  'Finance and professional services',
  'Information and culture',
  'Manufacturing',
  'Primary industries',
  'Public administration',
  'Transportation',
  'Utilities',
  'Wholesale and retail trade',
] as const
export interface DurationRow {
  year: number
  industry: string
  duration: number | null
  annual: number | null
  firstYear: number | null
  agreements: number | null
  employees: number | null
}
export interface DurationPoint {
  name: string
  duration: number
  annual: number
  firstYear: number
  agreements: number
  employees: number
  size: number
  missing: number
}
const metrics = [
  'Duration_Months_Avg',
  'Annual_Pct_Adjustment_Avg',
  'First_Year_Pct_Adjustment_Avg',
  'Number_of_Agreements',
  'Number_of_Employees',
] as const
function number(value: unknown): number | null {
  if (value === '' || value === null || value === undefined) return null
  if (typeof value !== 'string' || !value.trim() || !Number.isFinite(Number(value)))
    throw new Error('Invalid duration number')
  return Number(value)
}
export function parseDuration(text: string): DurationRow[] {
  const seen = new Set<string>()
  return settlementRows(text, ['Year', 'Industry', 'Sector_Type', ...metrics]).flatMap((row) => {
    if (
      row.Sector_Type !== 'All Sectors' ||
      !durationIndustries.some((name) => name === row.Industry)
    )
      return []
    const year = number(row.Year)
    if (year === null || !Number.isInteger(year) || year < 1900 || year > 2200)
      throw new Error('Invalid duration year')
    const industry = String(row.Industry),
      key = `${year}:${industry}`
    if (seen.has(key)) throw new Error('Duplicate duration observation')
    seen.add(key)
    return [
      {
        year,
        industry,
        duration: number(row.Duration_Months_Avg),
        annual: number(row.Annual_Pct_Adjustment_Avg),
        firstYear: number(row.First_Year_Pct_Adjustment_Avg),
        agreements: number(row.Number_of_Agreements),
        employees: number(row.Number_of_Employees),
      },
    ]
  })
}
/** Original chart: arithmetic means over rows, blank inputs contribute zero, not omitted rows.
 * Retain missing counts separately so a missing source observation is never described as an observed zero.
 */
export function durationPoints(
  rows: DurationRow[],
  years: readonly number[] = [2023, 2024, 2025],
): DurationPoint[] {
  const points = durationIndustries.flatMap((name) => {
    const selected = rows.filter((row) => row.industry === name && years.includes(row.year))
    if (!selected.length) return []
    const sum = (key: 'duration' | 'annual' | 'firstYear' | 'agreements' | 'employees') =>
      selected.reduce((total, row) => total + (row[key] ?? 0), 0)
    const agreements = sum('agreements')
    const point = {
      name,
      duration: Number((sum('duration') / selected.length).toFixed(1)),
      annual: Number((sum('annual') / selected.length).toFixed(2)),
      firstYear: Number((sum('firstYear') / selected.length).toFixed(2)),
      agreements: Math.round(agreements),
      employees: Math.round(sum('employees')),
      weight: Math.max(agreements, 1),
      missing: selected.reduce(
        (count, row) =>
          count +
          [row.duration, row.annual, row.firstYear, row.agreements, row.employees].filter(
            (v) => v === null,
          ).length,
        0,
      ),
    }
    if (
      ![
        point.duration,
        point.annual,
        point.firstYear,
        point.agreements,
        point.employees,
        point.weight,
      ].every(Number.isFinite)
    )
      throw new Error('Duration aggregate overflow')
    return [point]
  })
  const min = Math.min(...points.map((p) => p.weight)),
    max = Math.max(...points.map((p) => p.weight))
  if (
    points.length &&
    [
      Math.max(...points.map((p) => p.duration)) - Math.min(...points.map((p) => p.duration)),
      Math.max(...points.map((p) => p.annual)) - Math.min(...points.map((p) => p.annual)),
      max - min,
    ].some((range) => !Number.isFinite(range))
  )
    throw new Error('Duration plot range overflow')
  return points.map((p) => ({
    ...p,
    size: min === max ? 65 : 18 + ((p.weight - min) / (max - min)) * 47,
  }))
}
