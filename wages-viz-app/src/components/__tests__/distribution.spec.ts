import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import Papa from 'papaparse'
import {
  parseDistribution,
  distributionSummary,
  distributionIndustries,
  distributionYears,
} from '../../lib/distribution'
const header =
  'Year,Industry,Sector_Type,Annual_Pct_Adjustment_Avg,Number_of_Employees,Number_of_Agreements\n'
const csv = readFileSync('public/data/TABLEAU_sector_year.csv', 'utf8')
describe('distribution original output', () => {
  it('matches original indexed quartiles, all yearly scatter values, rounded labels and source counts', () => {
    const original = Papa.parse<Record<string, unknown>>(csv, {
      header: true,
      dynamicTyping: true,
    }).data
    for (const years of [distributionYears, ...distributionYears.map((year) => [year])]) {
      const filtered = original.filter(
        (r) =>
          r.Sector_Type === 'All Sectors' &&
          distributionIndustries.some((name) => name === r.Industry) &&
          years.includes(Number(r.Year)),
      )
      const boxes = distributionIndustries.flatMap((industry) => {
        const values = filtered
          .filter((r) => r.Industry === industry)
          .map((r) => r.Annual_Pct_Adjustment_Avg)
          .filter((v): v is number => typeof v === 'number' && !isNaN(v))
          .sort((a, b) => a - b)
        if (!values.length) return []
        return [
          {
            industry,
            min: Math.min(...values),
            q1: values[Math.floor(values.length * 0.25)],
            median: values[Math.floor(values.length * 0.5)],
            q3: values[Math.floor(values.length * 0.75)],
            max: Math.max(...values),
          },
        ]
      })
      const points = distributionIndustries.flatMap((industry) =>
        filtered
          .filter((r) => r.Industry === industry && typeof r.Annual_Pct_Adjustment_Avg === 'number')
          .map((r) => ({
            industry,
            year: r.Year,
            annual: r.Annual_Pct_Adjustment_Avg,
            wage: Number(Number(r.Annual_Pct_Adjustment_Avg).toFixed(2)),
            employees: r.Number_of_Employees,
            agreements: r.Number_of_Agreements,
          })),
      )
      const model = distributionSummary(parseDistribution(csv), years)
      expect(model.boxes).toEqual(boxes)
      expect(model.points).toEqual(points)
    }
  })
  it('preserves even-sample indexed median, omitted missing observation and observed zero/negative values', () => {
    const rows = parseDistribution(
      header +
        '2020,Manufacturing,All Sectors,,0,0\n2021,Manufacturing,All Sectors,-2,0,0\n2022,Manufacturing,All Sectors,0,,\n2023,Manufacturing,All Sectors,4,10,1\n2024,Manufacturing,All Sectors,8,20,2\n',
    )
    const model = distributionSummary(rows)
    expect(model.boxes).toEqual([
      { industry: 'Manufacturing', min: -2, q1: 0, median: 4, q3: 8, max: 8 },
    ])
    expect(model.points).toHaveLength(4)
    expect(model.observations[0]?.annual).toBeNull()
    expect(model.points[1]).toMatchObject({ annual: 0, employees: null, agreements: null })
  })
  it('handles a single observation and categories with no valid annual values', () => {
    expect(
      distributionSummary(
        parseDistribution(
          header +
            '2023,Manufacturing,All Sectors,2,0,0\n2023,Information and culture,All Sectors,,0,0\n',
        ),
      ).boxes,
    ).toEqual([{ industry: 'Manufacturing', min: 2, q1: 2, median: 2, q3: 2, max: 2 }])
  })
  it('accepts a valid empty source', () =>
    expect(distributionSummary(parseDistribution(header)).boxes).toEqual([]))
  for (const body of [
    'bad,columns\n1,2',
    header + '2023,Manufacturing,All Sectors,no,1,1\n',
    header + '2023,Manufacturing,All Sectors,Infinity,1,1\n',
    header + 'bad,Manufacturing,All Sectors,1,1,1\n',
    header + '2023,Manufacturing,All Sectors,1,1,1\n2023,Manufacturing,All Sectors,1,1,1\n',
    header +
      '2023,Manufacturing,All Sectors,1e308,1,1\n2024,Manufacturing,All Sectors,-1e308,1,1\n',
  ])
    it('rejects malformed, duplicate or unsupported source ranges', () =>
      expect(() => parseDistribution(body)).toThrow())
})
