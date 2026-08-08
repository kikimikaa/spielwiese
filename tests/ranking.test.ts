import { describe, expect, it } from 'vitest'
import { isRankingComplete, MIN_RANKING_ITEMS, neutralOrder } from '../core/ranking'
import type { RankingSpec } from '../core/types'

const ranking = (over: Partial<RankingSpec> = {}): RankingSpec => ({
  prompt: 'Order by size',
  items: ['Jupiter', 'Saturn', 'Earth'],
  ...over,
})

describe('isRankingComplete', () => {
  it('accepts a prompt with at least the minimum items', () => {
    expect(isRankingComplete(ranking())).toBe(true)
    expect(ranking().items.length).toBe(MIN_RANKING_ITEMS)
  })

  it('rejects fewer than the minimum items', () => {
    expect(isRankingComplete(ranking({ items: ['a', 'b'] }))).toBe(false)
  })

  it('rejects a blank prompt', () => {
    expect(isRankingComplete(ranking({ prompt: '   ' }))).toBe(false)
  })
})

describe('neutralOrder', () => {
  it('returns a stable code-point sort, not the input order', () => {
    expect(neutralOrder(['Jupiter', 'Saturn', 'Earth'])).toEqual(['Earth', 'Jupiter', 'Saturn'])
  })

  it('does not mutate the input array', () => {
    const items = ['c', 'a', 'b']
    const sorted = neutralOrder(items)
    expect(items).toEqual(['c', 'a', 'b'])
    expect(sorted).toEqual(['a', 'b', 'c'])
  })

  it('handles an empty list', () => {
    expect(neutralOrder([])).toEqual([])
  })
})
