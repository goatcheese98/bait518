import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import Papa from 'papaparse'
import {
  parseRegions,
  regionalSummary,
  regions,
  regionalYears,
  regionalHighlights,
} from '../../lib/regions'
const header =
  'Year,Industry,Sector_Type,Annual_Pct_Adjustment_Avg,First_Year_Pct_Adjustment_Avg,Number_of_Employees,Number_of_Agreements\n'
const csv = readFileSync('public/data/TABLEAU_sector_year.csv', 'utf8')
describe('regional original output', () => {
  it('matches original unrounded means, total counts, plotted annual rounding, series order and bubble sizes for all production years', () => {
    const original = Papa.parse<Record<string, unknown>>(csv, {
      header: true,
      dynamicTyping: true,
    }).data
    for (const years of [regionalYears, ...regionalYears.map((year) => [year])]) {
      const expected = regions.flatMap((name) => {
        const rows = original.filter(
          (r) =>
            r.Sector_Type === 'All Sectors' &&
            r.Industry === name &&
            years.includes(Number(r.Year)),
        )
        if (!rows.length) return []
        const sum = (key: string) => rows.reduce((n, r) => n + (Number(r[key]) || 0), 0)
        return [
          {
            name,
            annualAvg: sum('Annual_Pct_Adjustment_Avg') / rows.length,
            firstYearAvg: sum('First_Year_Pct_Adjustment_Avg') / rows.length,
            employees: sum('Number_of_Employees') / rows.length,
            employeesTotal: sum('Number_of_Employees'),
            agreements: sum('Number_of_Agreements'),
            missing: 0,
          },
        ]
      })
      const min = Math.min(...expected.map((p) => p.employees)),
        max = Math.max(...expected.map((p) => p.employees))
      const ordered = [
        ...regionalHighlights.flatMap((name) => expected.filter((p) => p.name === name)),
        ...expected.filter((p) => !regionalHighlights.some((name) => name === p.name)),
      ]
      expect(regionalSummary(parseRegions(csv), years)).toEqual(
        ordered.map((p) => ({
          ...p,
          plotAnnual: Number(p.annualAvg.toFixed(2)),
          size: min === max ? 70 : 18 + ((p.employees - min) / (max - min)) * 52,
        })),
      )
    }
  })
  it('preserves blank contribution, observed zero, negatives and fractional source precision', () => {
    expect(
      regionalSummary(
        parseRegions(
          header + '2023,Ontario,All Sectors,,0,0,0\n2024,Ontario,All Sectors,-2.345,1.234,3,2\n',
        ),
      )[0],
    ).toMatchObject({
      annualAvg: -1.1725,
      firstYearAvg: 0.617,
      employees: 1.5,
      employeesTotal: 3,
      agreements: 2,
      missing: 1,
      plotAnnual: -1.17,
      size: 70,
    })
  })
  it('accepts a valid empty source', () => expect(parseRegions(header)).toEqual([]))
  for (const body of [
    'bad,columns\n1,2',
    header + '2023,Ontario,All Sectors,no,1,1,1\n',
    header + '2023,Ontario,All Sectors,Infinity,1,1,1\n',
    header + 'bad,Ontario,All Sectors,1,1,1,1\n',
    header + '2023,Ontario,All Sectors,1,1,1,1\n2023,Ontario,All Sectors,1,1,1,1\n',
    header + '2023,Ontario,All Sectors,1,1,1e308,1\n2024,Ontario,All Sectors,1,1,1e308,1\n',
  ])
    it('rejects malformed, duplicate or overflowing source data', () =>
      expect(() => parseRegions(body)).toThrow())
})
