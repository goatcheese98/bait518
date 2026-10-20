import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { settlementRows } from './settlementCsv'
export interface ChartRecord {
  year: number
  category: string
  annual: number | null
  firstYear: number | null
  employees: number | null
  agreements: number | null
}
const columns = {
  annual: 'Annual_Pct_Adjustment_Avg',
  firstYear: 'First_Year_Pct_Adjustment_Avg',
  employees: 'Number_of_Employees',
  agreements: 'Number_of_Agreements',
} as const
export function chartRecords(
  text: string,
  categories: readonly string[],
  required: readonly (keyof typeof columns)[],
): ChartRecord[] {
  const seen = new Set<string>()
  function numeric(value: unknown): number | null {
    if (value === '' || value === null || value === undefined) return null
    if (typeof value !== 'string' || !value.trim() || !Number.isFinite(Number(value)))
      throw new Error('Invalid chart number')
    return Number(value)
  }
  return settlementRows(text, [
    'Year',
    'Industry',
    'Sector_Type',
    ...required.map((key) => columns[key]),
  ]).flatMap((row) => {
    if (row.Sector_Type !== 'All Sectors' || !categories.some((name) => name === row.Industry))
      return []
    const year = numeric(row.Year),
      category = String(row.Industry)
    if (year === null || !Number.isInteger(year) || year < 1900 || year > 2200)
      throw new Error('Invalid chart year')
    const key = `${year}:${category}`
    if (seen.has(key)) throw new Error('Duplicate chart observation')
    seen.add(key)
    return [
      {
        year,
        category,
        annual: numeric(row[columns.annual]),
        firstYear: numeric(row[columns.firstYear]),
        employees: numeric(row[columns.employees]),
        agreements: numeric(row[columns.agreements]),
      },
    ]
  })
}
export function finiteChart(values: readonly number[]) {
  if (!values.every(Number.isFinite)) throw new Error('Chart aggregate or range overflow')
}
export function validatePeriods<T>(
  rows: ChartRecord[],
  summarize: (rows: ChartRecord[], years?: readonly number[]) => T,
): ChartRecord[] {
  summarize(rows)
  for (const year of new Set(rows.map((row) => row.year))) summarize(rows, [year])
  return rows
}
/** Shared request lifecycle: reject HTTP/schema errors and abort on retry/unmount. */
export function useChartSource<T>(parse: (text: string) => T[]) {
  const rows = shallowRef<T[]>([]),
    loading = ref(true),
    error = ref('')
  let controller: AbortController | undefined
  async function load() {
    controller?.abort()
    const request = new AbortController()
    controller = request
    loading.value = true
    error.value = ''
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}data/TABLEAU_sector_year.csv`, {
        signal: request.signal,
      })
      if (!response.ok) throw new Error('Dataset request failed')
      const parsed = parse(await response.text())
      if (!request.signal.aborted) rows.value = parsed
    } catch (cause) {
      if (
        !(cause instanceof DOMException && cause.name === 'AbortError') &&
        !request.signal.aborted
      )
        error.value =
          cause instanceof Error && cause.message.startsWith('Unsupported plot range')
            ? cause.message
            : 'The dataset could not load. Check the connection or dataset format and retry.'
    } finally {
      if (controller === request) loading.value = false
    }
  }
  onMounted(() => {
    void load()
  })
  onBeforeUnmount(() => controller?.abort())
  return { rows, loading, error, load }
}
