/** Preserve ordinary integer padding, but never emit reversed, collapsed or infinite axes. */
export function plotExtent(
  values: readonly number[],
  padding: number,
  negativeBaseline = false,
): readonly [number, number] {
  if (!values.length) return [0, 1]
  const min = Math.min(...values),
    max = Math.max(...values)
  const baseline = negativeBaseline && min < 0
  let low = Math.floor(min - padding),
    high = Math.ceil(max + padding)
  if (baseline) high = Math.max(0, high)
  if (negativeBaseline && min >= 0) low = Math.max(0, low)
  const valid = () =>
    Number.isFinite(low) &&
    Number.isFinite(high) &&
    high > low &&
    Number.isFinite(high - low) &&
    low <= min &&
    high >= max
  if (!valid()) {
    const relative = Math.max(padding, Math.max(Math.abs(min), Math.abs(max)) * 0.05)
    low = min - relative
    high = max + relative
    if (baseline) high = Math.max(0, high)
  }
  if (!valid())
    throw new Error(
      'Unsupported plot range: reduce the selected period or inspect the source values; a finite ordered axis cannot represent this range.',
    )
  return [low, high]
}
