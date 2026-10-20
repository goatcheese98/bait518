import { settlementRows } from './settlementCsv'

export interface Observation {
  year: number
  industry: string
  sector: 'Public Sector' | 'Private Sector'
  adjustment: number | null
}
export interface Comparison {
  year: number
  public: number | null
  private: number | null
  difference: number | null
}

export function parseWages(text: string): Observation[] {
  const data = settlementRows(text, [
    'Year',
    'Industry',
    'Sector_Type',
    'Annual_Pct_Adjustment_Avg',
  ])
  const seen = new Set<string>()
  const observations: Observation[] = []
  for (const row of data) {
    const sector = row.Sector_Type
    if (
      typeof sector !== 'string' ||
      !['All Sectors', 'Public Sector', 'Private Sector'].includes(sector)
    )
      throw new Error('Invalid sector')
    const yearText = typeof row.Year === 'string' ? row.Year : ''
    const year = Number(yearText)
    const industry = typeof row.Industry === 'string' ? row.Industry.trim() : ''
    const value =
      typeof row.Annual_Pct_Adjustment_Avg === 'string' ? row.Annual_Pct_Adjustment_Avg.trim() : ''
    const adjustment = value === '' ? null : Number(value)
    if (
      !/^\d{4}$/.test(yearText) ||
      !Number.isInteger(year) ||
      !industry ||
      (adjustment !== null && !Number.isFinite(adjustment))
    )
      throw new Error('Invalid observation')
    const key = JSON.stringify([year, industry, sector])
    if (seen.has(key)) throw new Error('Duplicate observation')
    seen.add(key)
    if (sector === 'Public Sector' || sector === 'Private Sector')
      observations.push({ year, industry, sector, adjustment })
  }
  return observations
}

export function compareWages(
  data: readonly Observation[],
  industry: string,
  start: number,
  end: number,
): Comparison[] {
  if (start > end) return []
  const selected = data.filter(
    (row) => row.industry === industry && row.year >= start && row.year <= end,
  )
  return [...new Set(selected.map((row) => row.year))]
    .sort((a, b) => a - b)
    .map((year) => {
      const value = (sector: Observation['sector']) =>
        selected.find((row) => row.year === year && row.sector === sector)?.adjustment ?? null
      const publicValue = value('Public Sector'),
        privateValue = value('Private Sector')
      return {
        year,
        public: publicValue,
        private: privateValue,
        difference:
          publicValue === null || privateValue === null ? null : publicValue - privateValue,
      }
    })
}
export const percent = (value: number | null): string =>
  value === null ? 'Not available' : `${value.toFixed(1)}%`
export const points = (value: number | null): string =>
  value === null ? 'Not available' : `${value > 0 ? '+' : ''}${value.toFixed(1)} pp`
