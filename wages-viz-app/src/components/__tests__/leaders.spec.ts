import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import Papa from 'papaparse'
import { parseLeaders, leaderSummary } from '../../lib/leaders'
import { durationIndustries } from '../../lib/duration'
const header =
  'Year,Industry,Sector_Type,Annual_Pct_Adjustment_Avg,First_Year_Pct_Adjustment_Avg,Number_of_Employees\n'
const csv = readFileSync('public/data/TABLEAU_sector_year.csv', 'utf8')
describe('industry leaders original output', () => {
  it('matches every ranked bar, rounded statistic, latest observation and top-eight order for default and individual years', () => {
    const original = Papa.parse<Record<string, unknown>>(csv, {
      header: true,
      dynamicTyping: true,
    }).data
    for (const years of [[2023, 2024, 2025], ...Array.from({ length: 10 }, (_, i) => [2016 + i])]) {
      const expected = durationIndustries
        .map((industry) => {
          const rows = original.filter(
            (r) =>
              r.Industry === industry &&
              r.Sector_Type === 'All Sectors' &&
              years.includes(Number(r.Year)),
          )
          const avg = (key: string) => {
            const values = rows.map((r) => r[key]).filter((v): v is number => typeof v === 'number')
            return values.length ? values.reduce((n, v) => n + v, 0) / values.length : 0
          }
          const latest = rows.find((r) => r.Year === 2025) || rows[rows.length - 1]
          return {
            industry,
            avgAnnual: Number(avg('Annual_Pct_Adjustment_Avg').toFixed(2)),
            avgFirstYear: Number(avg('First_Year_Pct_Adjustment_Avg').toFixed(2)),
            employeeTotal: Math.round(
              rows.reduce(
                (n, r) =>
                  n + (typeof r.Number_of_Employees === 'number' ? r.Number_of_Employees : 0),
                0,
              ),
            ),
            latestYear: latest?.Year ?? null,
            latestAnnual: latest?.Annual_Pct_Adjustment_Avg ?? null,
            missing: 0,
          }
        })
        .filter((r) => r.avgAnnual > 0)
        .sort((a, b) => b.avgAnnual - a.avgAnnual)
        .slice(0, 8)
      expect(leaderSummary(parseLeaders(csv), years)).toEqual(expected)
    }
  })
  it('omits missing adjustments but retains observed zero and latest row in source order', () => {
    const points = leaderSummary(
      parseLeaders(
        header + '2024,Construction,All Sectors,,0,10\n2023,Construction,All Sectors,4,2,0\n',
      ),
    )
    expect(points[0]).toMatchObject({
      avgAnnual: 4,
      avgFirstYear: 1,
      employeeTotal: 10,
      latestYear: 2023,
      latestAnnual: 4,
      missing: 1,
    })
  })
  it('retains the original positive rounded-average ranking filter', () => {
    expect(
      leaderSummary(
        parseLeaders(
          header + '2023,Construction,All Sectors,0,0,0\n2023,Manufacturing,All Sectors,-2,0,0\n',
        ),
      ),
    ).toEqual([])
  })
  it('accepts a valid empty source', () => expect(parseLeaders(header)).toEqual([]))
  for (const body of [
    'bad,columns\n1,2',
    header + '2023,Construction,All Sectors,no,1,1\n',
    header + '2023,Construction,All Sectors,Infinity,1,1\n',
    header + 'bad,Construction,All Sectors,1,1,1\n',
    header + '2023,Construction,All Sectors,1,1,1\n2023,Construction,All Sectors,1,1,1\n',
    header + '2023,Construction,All Sectors,1,1,1e308\n2024,Construction,All Sectors,1,1,1e308\n',
  ])
    it('rejects malformed, duplicate or overflowing source data', () =>
      expect(() => parseLeaders(body)).toThrow())
})
