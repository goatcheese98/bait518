import { describe, expect, it } from 'vitest'
import { compareWages, parseWages, percent, points } from '../../lib/wages'
const header = 'Year,Industry,Sector_Type,Annual_Pct_Adjustment_Avg\n'
describe('source contract and comparisons', () => {
  it('parses quoted categories, escaped quotes, CRLF and BOM', () => {
    expect(
      parseWages(
        '\uFEFF' +
          header +
          '2020,"Education, health",Public Sector,0\r\n2021,"A ""quote""",Private Sector,2\n',
      ),
    ).toEqual([
      { year: 2020, industry: 'Education, health', sector: 'Public Sector', adjustment: 0 },
      { year: 2021, industry: 'A "quote"', sector: 'Private Sector', adjustment: 2 },
    ])
  })
  it('keeps zero distinct from absent and blank observations; uses percentage-point differences', () => {
    const rows = parseWages(
      header +
        '2021,A,Public Sector,2\n2020,A,Public Sector,0\n2020,A,Private Sector,1.5\n2021,A,Private Sector,\n2022,B,Public Sector,4\n',
    )
    expect(compareWages(rows, 'A', 2020, 2021)).toEqual([
      { year: 2020, public: 0, private: 1.5, difference: -1.5 },
      { year: 2021, public: 2, private: null, difference: null },
    ])
    expect(compareWages(rows, 'A', 2021, 2020)).toEqual([])
    expect(compareWages(rows, 'Missing', 2020, 2022)).toEqual([])
    expect(percent(0)).toBe('0.0%')
    expect(percent(null)).toBe('Not available')
    expect(points(null)).toBe('Not available')
    expect(points(0.6)).toBe('+0.6 pp')
  })
  it.each([
    'Wrong,columns\n1,2',
    header + '2020,A,Public Sector,Infinity',
    header + '2020,A,Public Sector,nope',
    header + 'wat,A,Public Sector,2',
    header + '2020,,Public Sector,2',
    header + '2020,A,Unknown,2',
    header + '2020,A,Public Sector,2\n2020,A,Public Sector,3',
    header + '2020,"Unclosed,Public Sector,2',
    header + '2020,A,Public Sector,2,extra',
  ])('rejects malformed external data: %s', (text) => {
    expect(() => parseWages(text)).toThrow()
  })
  it('accepts an empty dataset with a valid schema and excludes All Sectors', () => {
    expect(parseWages(header)).toEqual([])
    expect(parseWages(header + '2020,A,All Sectors,3')).toEqual([])
  })
})
