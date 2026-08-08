import { describe, expect, it } from 'vitest'
import { EMPTY_GAME_FILTER, filterGames, isFilterActive } from '../core/library'
import type { GameDef } from '../core/types'

const game = (over: Partial<GameDef> = {}): GameDef => ({
  id: 'g1',
  title: 'Sackhüpfen',
  short: 'Hüpfen bis zum Ziel',
  rules: 'Erstes Team im Ziel gewinnt.',
  location: 'outdoor',
  scoringType: 'versus',
  ...over,
})

const library: GameDef[] = [
  game({ id: 'a', title: 'Sackhüpfen', short: 'Draußen springen', location: 'outdoor' }),
  game({
    id: 'b',
    title: 'Hauptstadt-Quiz',
    short: 'Wer weiß mehr?',
    location: 'indoor',
    kind: 'quiz',
  }),
  game({ id: 'c', title: 'Dosenwerfen', short: 'Ziel treffen', location: 'both' }),
]

describe('filterGames', () => {
  it('returns everything for the empty filter', () => {
    expect(filterGames(library, EMPTY_GAME_FILTER)).toHaveLength(3)
  })

  it('matches the query against title and short, case-insensitively', () => {
    expect(filterGames(library, { ...EMPTY_GAME_FILTER, query: 'quiz' }).map((g) => g.id)).toEqual([
      'b',
    ])
    expect(
      filterGames(library, { ...EMPTY_GAME_FILTER, query: 'SPRINGEN' }).map((g) => g.id),
    ).toEqual(['a'])
  })

  it('ignores surrounding whitespace in the query', () => {
    expect(
      filterGames(library, { ...EMPTY_GAME_FILTER, query: '  dosen  ' }).map((g) => g.id),
    ).toEqual(['c'])
  })

  it('filters by kind, treating a missing kind as freeform', () => {
    expect(filterGames(library, { ...EMPTY_GAME_FILTER, kind: 'quiz' }).map((g) => g.id)).toEqual([
      'b',
    ])
    expect(
      filterGames(library, { ...EMPTY_GAME_FILTER, kind: 'freeform' }).map((g) => g.id),
    ).toEqual(['a', 'c'])
  })

  it('filters by location', () => {
    expect(
      filterGames(library, { ...EMPTY_GAME_FILTER, location: 'indoor' }).map((g) => g.id),
    ).toEqual(['b'])
  })

  it('combines facets (all must match)', () => {
    expect(
      filterGames(library, { query: 'quiz', kind: 'quiz', location: 'indoor' }).map((g) => g.id),
    ).toEqual(['b'])
    expect(filterGames(library, { query: 'quiz', kind: 'freeform', location: 'all' })).toEqual([])
  })

  it('returns an empty list when nothing matches', () => {
    expect(filterGames(library, { ...EMPTY_GAME_FILTER, query: 'zzz' })).toEqual([])
  })

  it('handles an empty library', () => {
    expect(filterGames([], { ...EMPTY_GAME_FILTER, query: 'quiz' })).toEqual([])
  })

  it('preserves the original order', () => {
    expect(
      filterGames(library, { ...EMPTY_GAME_FILTER, location: 'all' }).map((g) => g.id),
    ).toEqual(['a', 'b', 'c'])
  })
})

describe('isFilterActive', () => {
  it('is false for the empty filter and a whitespace-only query', () => {
    expect(isFilterActive(EMPTY_GAME_FILTER)).toBe(false)
    expect(isFilterActive({ ...EMPTY_GAME_FILTER, query: '   ' })).toBe(false)
  })

  it('is true when any facet narrows the list', () => {
    expect(isFilterActive({ ...EMPTY_GAME_FILTER, query: 'a' })).toBe(true)
    expect(isFilterActive({ ...EMPTY_GAME_FILTER, kind: 'quiz' })).toBe(true)
    expect(isFilterActive({ ...EMPTY_GAME_FILTER, location: 'indoor' })).toBe(true)
  })
})
