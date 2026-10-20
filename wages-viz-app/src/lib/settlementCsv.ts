import Papa from 'papaparse'

/** Parse CSV syntax and schema before interpreting unknown external field values. */
export function settlementRows(
  text: string,
  required: readonly string[],
): Record<string, unknown>[] {
  const parsed = Papa.parse<Record<string, unknown>>(text.replace(/^\uFEFF/, ''), {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: false,
  })
  const fields = parsed.meta.fields
  if (
    parsed.errors.length ||
    !fields ||
    required.some((name) => !fields.includes(name)) ||
    ('renamedHeaders' in parsed.meta && parsed.meta.renamedHeaders !== null) ||
    new Set(fields).size !== fields.length
  )
    throw new Error('Invalid CSV schema or rows')
  return parsed.data
}
