import { chartRecords, finiteChart, validatePeriods, type ChartRecord } from './chartSource'
import { plotExtent } from './plotScale'
export const distributionIndustries = [
  'Information and culture',
  'Education, health, and social services',
  'Public administration',
  'Manufacturing',
  'Entertainment and hospitality',
] as const
export const distributionYears = Array.from({ length: 10 }, (_, i) => 2016 + i)
export function distributionSummary(
  rows: ChartRecord[],
  years: readonly number[] = distributionYears,
) {
  const observations = rows.filter((row) => years.includes(row.year))
  const boxes = distributionIndustries.flatMap((industry) => {
    const values = observations
      .filter((r) => r.category === industry)
      .map((r) => r.annual)
      .filter((v): v is number => v !== null)
      .sort((a, b) => a - b)
    if (!values.length) return []
    // Deliberately preserve original indexed order statistics, not interpolated quantiles.
    return [
      {
        industry,
        min: values[0]!,
        q1: values[Math.floor(values.length * 0.25)]!,
        median: values[Math.floor(values.length * 0.5)]!,
        q3: values[Math.floor(values.length * 0.75)]!,
        max: values[values.length - 1]!,
      },
    ]
  })
  const points = distributionIndustries.flatMap((industry) =>
    observations
      .filter((r) => r.category === industry && r.annual !== null)
      .map((r) => ({
        industry,
        year: r.year,
        annual: r.annual!,
        wage: Number(r.annual!.toFixed(2)),
        employees: r.employees,
        agreements: r.agreements,
      })),
  )
  const values = points.map((p) => p.annual)
  if (values.length) {
    finiteChart([Math.max(...values) - Math.min(...values)])
    distributionExtent(values)
  }
  return { boxes, points, observations }
}
export function distributionExtent(values: readonly number[]): readonly [number, number] {
  const range = plotExtent(values, 1, true)
  // Original distribution starts at zero for nonnegative observations; retain negatives honestly.
  return [values.every((v) => v >= 0) ? 0 : range[0], range[1]]
}
export const parseDistribution = (text: string) =>
  validatePeriods(
    chartRecords(text, distributionIndustries, ['annual', 'employees', 'agreements']),
    distributionSummary,
  )
