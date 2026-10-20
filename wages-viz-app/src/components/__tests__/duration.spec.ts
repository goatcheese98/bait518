import { describe, expect, it } from 'vitest'
import Papa from 'papaparse'
import { readFileSync } from 'node:fs'
import { durationIndustries, durationPoints, parseDuration } from '../../lib/duration'
const header =
  'Year,Industry,Sector_Type,Duration_Months_Avg,Annual_Pct_Adjustment_Avg,First_Year_Pct_Adjustment_Avg,Number_of_Agreements,Number_of_Employees\n'
const source = readFileSync('public/data/TABLEAU_sector_year.csv', 'utf8')
describe('duration migration', () => {
  it('matches original dynamic-typing averages, totals, industry order and bubble diameters for every production period', () => {
    const original = Papa.parse<Record<string, string | number>>(source, {
      header: true,
      dynamicTyping: true,
    }).data
    for (const years of [[2023, 2024, 2025], ...Array.from({ length: 10 }, (_, i) => [2016 + i])]) {
      const expected = durationIndustries.flatMap((name) => {
        const rows = original.filter(
          (r) =>
            r.Sector_Type === 'All Sectors' &&
            r.Industry === name &&
            years.includes(Number(r.Year)),
        )
        if (!rows.length) return []
        const sum = (field: string) => rows.reduce((n, r) => n + (Number(r[field]) || 0), 0)
        return [
          {
            name,
            duration: Number((sum('Duration_Months_Avg') / rows.length).toFixed(1)),
            annual: Number((sum('Annual_Pct_Adjustment_Avg') / rows.length).toFixed(2)),
            firstYear: Number((sum('First_Year_Pct_Adjustment_Avg') / rows.length).toFixed(2)),
            agreements: Math.round(sum('Number_of_Agreements')),
            employees: Math.round(sum('Number_of_Employees')),
            weight: Math.max(sum('Number_of_Agreements'), 1),
          },
        ]
      })
      const weights = expected.map((p) => p.weight),
        min = Math.min(...weights),
        max = Math.max(...weights)
      expect(durationPoints(parseDuration(source), years)).toEqual(
        expected.map((p) => ({
          name: p.name,
          duration: p.duration,
          annual: p.annual,
          firstYear: p.firstYear,
          agreements: p.agreements,
          employees: p.employees,
          missing: 0,
          size: min === max ? 65 : 18 + ((p.weight - min) / (max - min)) * 47,
          weight: p.weight,
        })),
      )
    }
  })
  it('preserves original blank contribution but distinguishes missing from observed zero', () => {
    const rows = parseDuration(
      header +
        '2023,Construction,All Sectors,,0,-1.25,0,0\n2024,Construction,All Sectors,12,4,3,2,10\n',
    )
    expect(rows[0]?.duration).toBeNull()
    expect(rows[0]?.annual).toBe(0)
    expect(durationPoints(rows)[0]).toMatchObject({
      duration: 6,
      annual: 2,
      firstYear: 0.88,
      agreements: 2,
      employees: 10,
      missing: 1,
      size: 65,
    })
  })
  it('handles a valid empty dataset and excludes other sectors/categories/years from the default slice', () => {
    expect(durationPoints(parseDuration(header))).toEqual([])
    expect(
      durationPoints(
        parseDuration(
          header +
            '2022,Construction,All Sectors,12,1,1,1,1\n2023,Construction,Private Sector,12,1,1,1,1\n2023,All industries,All Sectors,12,1,1,1,1\n',
        ),
      ),
    ).toEqual([])
  })
  for (const body of [
    'bad,columns\n1,2',
    header + '2023,Construction,All Sectors,abc,1,1,1,1\n',
    header + '2023,Construction,All Sectors,12,Infinity,1,1,1\n',
    header + '2023.5,Construction,All Sectors,12,1,1,1,1\n',
    header + '2023,Construction,All Sectors,12,1,1,1,1\n2023,Construction,All Sectors,12,1,1,1,1\n',
  ]) {
    it('rejects malformed or ambiguous source data', () =>
      expect(() => parseDuration(body)).toThrow())
  }
  it('rejects a finite-input plot range that overflows', () => {
    const rows = parseDuration(
      header +
        '2023,Construction,All Sectors,1e308,1,1,1,1\n2023,Manufacturing,All Sectors,-1e308,1,1,1,1\n',
    )
    expect(() => durationPoints(rows)).toThrow(/range overflow/)
  })
  it('rejects overflowing totals instead of emitting invalid plot geometry', () => {
    const rows = parseDuration(
      header +
        '2023,Construction,All Sectors,12,1,1,1e308,1\n2024,Construction,All Sectors,12,1,1,1e308,1\n',
    )
    expect(() => durationPoints(rows)).toThrow(/overflow/)
  })
})
