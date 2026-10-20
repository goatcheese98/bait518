import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import Papa from 'papaparse'
import { parseAnnualAdjustments, adjustmentGap, adjustmentPercent } from '../../lib/adjustments'
const header = 'Year,Industry,Sector_Type,First_Year_Pct_Adjustment_Avg,Annual_Pct_Adjustment_Avg\n'

describe('first-year / annual source contract', () => {
  it('matches the legacy series and two-decimal gap for every production aggregate observation', () => {
    const csv = readFileSync('public/data/TABLEAU_sector_year.csv', 'utf8')
    const legacy = Papa.parse<Record<string, unknown>>(csv, { header: true, dynamicTyping: true })
      .data.filter((row) => row.Industry === 'All industries' && row.Sector_Type === 'All Sectors')
      .sort((a, b) => Number(a.Year) - Number(b.Year))
    const actual = parseAnnualAdjustments(csv)
    expect(actual).toHaveLength(10)
    for (const [index, row] of legacy.entries()) {
      const first =
        typeof row.First_Year_Pct_Adjustment_Avg === 'number'
          ? Number(row.First_Year_Pct_Adjustment_Avg.toFixed(2))
          : null
      const annual =
        typeof row.Annual_Pct_Adjustment_Avg === 'number'
          ? Number(row.Annual_Pct_Adjustment_Avg.toFixed(2))
          : null
      expect(actual[index]?.year).toBe(row.Year)
      expect(actual[index]?.firstYear).toBe(first)
      expect(actual[index]?.annual).toBe(annual)
      expect(actual[index]?.gap?.toFixed(2)).toBe(
        first === null || annual === null ? undefined : (first - annual).toFixed(2),
      )
    }
  })
  it('sorts aggregate years without combining industries, jurisdictions or sectors', () => {
    const rows = parseAnnualAdjustments(
      header +
        '2021,All industries,All Sectors,3,2\n2020,All industries,All Sectors,1,2\n2020,Ontario,All Sectors,9,9\n2020,All industries,Public Sector,8,8\n',
    )
    expect(rows).toEqual([
      { year: 2020, firstYear: 1, annual: 2, gap: -1 },
      { year: 2021, firstYear: 3, annual: 2, gap: 1 },
    ])
  })
  it('preserves zero, missing, negative values and source precision without compounding', () => {
    const rows = parseAnnualAdjustments(
      header +
        '2020,All industries,All Sectors,0,\n2021,All industries,All Sectors,-1.25,0\n2022,All industries,All Sectors,1.234,0.12\n',
    )
    expect(rows[0]).toEqual({ year: 2020, firstYear: 0, annual: null, gap: null })
    expect(rows[1]).toEqual({ year: 2021, firstYear: -1.25, annual: 0, gap: -1.25 })
    expect(rows[2]?.firstYear).toBe(1.234)
    expect(rows[2]?.gap).toBeCloseTo(1.114)
    expect(adjustmentPercent(0)).toBe('0.0%')
    expect(adjustmentPercent(null)).toBe('Not available')
    expect(adjustmentGap(null)).toBe('Not available')
    expect(adjustmentGap(-0.001)).toBe('0.0 pp')
    expect(adjustmentGap(0.75)).toBe('+0.75 pp')
  })
  it('rejects finite inputs whose combined chart range would overflow', () => {
    expect(() =>
      parseAnnualAdjustments(
        header +
          '2020,All industries,All Sectors,1e308,0\n2021,All industries,All Sectors,-1e308,0',
      ),
    ).toThrow()
  })
  it('accepts valid empty data, BOM, quoted categories and CRLF', () => {
    expect(parseAnnualAdjustments(header)).toEqual([])
    expect(
      parseAnnualAdjustments('\uFEFF' + header + '2020,"Education, health",All Sectors,1,2\r\n'),
    ).toEqual([])
  })
  it.each([
    'wrong,columns\n1,2',
    header + '2020,All industries,All Sectors,Infinity,1',
    header + '2020,All industries,All Sectors,NaN,1',
    header + 'bad,All industries,All Sectors,1,2',
    header + '2020,All industries,Other,1,2',
    header + '2020,,All Sectors,1,2',
    header + '2020,All industries,All Sectors,1,2\n2020,All industries,All Sectors,2,3',
    header + '2020,All industries,All Sectors,1,2,extra',
    header + '2020,"unclosed,All Sectors,1,2',
    'Year,Industry,Sector_Type,First_Year_Pct_Adjustment_Avg,Annual_Pct_Adjustment_Avg,Year\n2020,All industries,All Sectors,1,2,2021',
  ])('rejects malformed data without manufacturing observations: %s', (csv) => {
    expect(() => parseAnnualAdjustments(csv)).toThrow()
  })
})
