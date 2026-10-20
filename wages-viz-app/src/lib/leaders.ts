import { durationIndustries } from './duration'
import { chartRecords, finiteChart, validatePeriods, type ChartRecord } from './chartSource'
export function leaderSummary(data: ChartRecord[], years: readonly number[] = [2023, 2024, 2025]) {
  const summary = durationIndustries
    .map((industry) => {
      const rows = data.filter((row) => row.category === industry && years.includes(row.year))
      const mean = (key: 'annual' | 'firstYear') => {
        const values = rows.map((row) => row[key]).filter((v): v is number => v !== null)
        return values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 0
      }
      const latest = rows.find((row) => row.year === 2025) ?? rows[rows.length - 1]
      const result = {
        industry,
        avgAnnual: Number(mean('annual').toFixed(2)),
        avgFirstYear: Number(mean('firstYear').toFixed(2)),
        employeeTotal: Math.round(rows.reduce((sum, row) => sum + (row.employees ?? 0), 0)),
        latestYear: latest?.year ?? null,
        latestAnnual: latest?.annual ?? null,
        missing: rows.reduce(
          (n, row) =>
            n + [row.annual, row.firstYear, row.employees].filter((v) => v === null).length,
          0,
        ),
      }
      finiteChart([result.avgAnnual, result.avgFirstYear, result.employeeTotal])
      return result
    })
    .filter((row) => row.avgAnnual > 0)
    .sort((a, b) => b.avgAnnual - a.avgAnnual)
    .slice(0, 8)
  return summary
}
export const parseLeaders = (text: string) =>
  validatePeriods(
    chartRecords(text, durationIndustries, ['annual', 'firstYear', 'employees']),
    leaderSummary,
  )
