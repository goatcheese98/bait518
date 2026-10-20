import { chartRecords, finiteChart, validatePeriods, type ChartRecord } from './chartSource'
import { plotExtent } from './plotScale'
export const regions = [
  'Alberta',
  'British Columbia',
  'Manitoba',
  'New Brunswick',
  'Newfoundland and Labrador',
  'Nova Scotia',
  'Ontario',
  'Prince Edward Island',
  'Quebec',
  'Saskatchewan',
  'Multi-provinces',
] as const
export const regionalHighlights = ['British Columbia', 'Ontario', 'Quebec', 'Alberta'] as const
export const regionalYears = Array.from({ length: 10 }, (_, i) => 2016 + i)
export function regionalSummary(data: ChartRecord[], years: readonly number[] = regionalYears) {
  const summary = regions.flatMap((name) => {
    const rows = data.filter((r) => r.category === name && years.includes(r.year))
    if (!rows.length) return []
    const sum = (key: 'annual' | 'firstYear' | 'employees' | 'agreements') =>
      rows.reduce((n, row) => n + (row[key] ?? 0), 0)
    const point = {
      name,
      annualAvg: sum('annual') / rows.length,
      firstYearAvg: sum('firstYear') / rows.length,
      employees: sum('employees') / rows.length,
      employeesTotal: sum('employees'),
      agreements: sum('agreements'),
      missing: rows.reduce(
        (n, r) =>
          n + [r.annual, r.firstYear, r.employees, r.agreements].filter((v) => v === null).length,
        0,
      ),
    }
    finiteChart([
      point.annualAvg,
      point.firstYearAvg,
      point.employees,
      point.employeesTotal,
      point.agreements,
    ])
    return [point]
  })
  const min = Math.min(...summary.map((p) => p.employees)),
    max = Math.max(...summary.map((p) => p.employees))
  if (summary.length) finiteChart([max - min])
  const points = summary.map((p) => ({
    ...p,
    plotAnnual: Number(p.annualAvg.toFixed(2)),
    size: min === max ? 70 : 18 + ((p.employees - min) / (max - min)) * 52,
  }))
  if (points.length) regionalAxes(points)
  // Match original series order: the four highlighted regions, then all other provinces.
  return [
    ...regionalHighlights.flatMap((name) => points.filter((p) => p.name === name)),
    ...points.filter((p) => !regionalHighlights.some((name) => name === p.name)),
  ]
}
export function regionalAxes(points: readonly { employees: number; annualAvg: number }[]) {
  if (!points.length) return { x: [0, 1] as const, y: [0, 1] as const }
  const values = points.map((p) => p.employees),
    min = Math.min(...values),
    max = Math.max(...values)
  const low = Math.max(Math.floor(min / 1000) * 1000 - 5000, 0),
    high = Math.ceil(max / 1000) * 1000 + 5000
  const x =
    Number.isFinite(high - low) && high > low && low <= min && high >= max
      ? ([low, high] as const)
      : plotExtent(values, 5000, true)
  return {
    x,
    y: plotExtent(
      points.map((p) => p.annualAvg),
      1,
      true,
    ),
  }
}
export const parseRegions = (text: string) =>
  validatePeriods(
    chartRecords(text, regions, ['annual', 'firstYear', 'employees', 'agreements']),
    regionalSummary,
  )
