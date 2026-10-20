import { expect, it } from 'vitest'
import { plotExtent } from '../../lib/plotScale'
it('preserves ordinary integer padding and includes a zero reference for negative adjustments', () => {
  expect(plotExtent([24, 48], 2)).toEqual([22, 50])
  expect(plotExtent([2.1, 7.65], 1, true)).toEqual([1, 9])
  expect(plotExtent([-2, -2], 1, true)).toEqual([-3, 0])
  expect(plotExtent([-2, 3], 1, true)).toEqual([-3, 4])
})
it('uses relative padding for equal very large finite values', () => {
  const [low, high] = plotExtent([1e20, 1e20], 2)
  expect(low).toBeLessThan(1e20)
  expect(high).toBeGreaterThan(1e20)
  expect(Number.isFinite(high - low)).toBe(true)
})
it('rejects unrepresentable padded extents with an actionable reason', () => {
  expect(() => plotExtent([Number.MAX_VALUE], 2)).toThrow(/Unsupported plot range/)
})
