import { describe, expect, it } from 'vitest'
import { isMatchComplete, MIN_MATCH_PAIRS, neutralRights } from '../core/match'
import type { MatchSpec } from '../core/types'

const match = (over: Partial<MatchSpec> = {}): MatchSpec => ({
  prompt: 'Match the capitals',
  pairs: [
    { left: 'France', right: 'Paris' },
    { left: 'Japan', right: 'Tokyo' },
    { left: 'Egypt', right: 'Cairo' },
  ],
  ...over,
})

describe('isMatchComplete', () => {
  it('accepts a prompt with at least the minimum pairs', () => {
    expect(isMatchComplete(match())).toBe(true)
    expect(match().pairs.length).toBe(MIN_MATCH_PAIRS)
  })

  it('rejects fewer than the minimum pairs', () => {
    expect(isMatchComplete(match({ pairs: [{ left: 'a', right: 'b' }] }))).toBe(false)
  })

  it('rejects a blank prompt', () => {
    expect(isMatchComplete(match({ prompt: '   ' }))).toBe(false)
  })
})

describe('neutralRights', () => {
  it('returns the right-hand values in a neutral order', () => {
    const rights = neutralRights([
      { left: 'France', right: 'Paris' },
      { left: 'Japan', right: 'Tokyo' },
      { left: 'Egypt', right: 'Cairo' },
    ])
    expect([...rights].sort()).toEqual(['Cairo', 'Paris', 'Tokyo'])
  })

  it('never lines up with the answer — scrambles when the rights are already sorted', () => {
    // Right column already alphabetical, so a plain sort would give the pairing away.
    const pairs = [
      { left: 'x', right: 'Alpha' },
      { left: 'y', right: 'Beta' },
      { left: 'z', right: 'Gamma' },
    ]
    const shown = neutralRights(pairs)
    expect(shown).not.toEqual(['Alpha', 'Beta', 'Gamma'])
    expect([...shown].sort()).toEqual(['Alpha', 'Beta', 'Gamma'])
  })

  it('handles an empty pair list', () => {
    expect(neutralRights([])).toEqual([])
  })
})
