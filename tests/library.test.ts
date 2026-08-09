import { describe, expect, it } from 'vitest'
import {
  activeFacetCount,
  EMPTY_GAME_FILTER,
  filterGames,
  isFilterActive,
  missingGames,
} from '../core/library'
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
    expect(
      filterGames(library, { ...EMPTY_GAME_FILTER, kinds: ['quiz'] }).map((g) => g.id),
    ).toEqual(['b'])
    expect(
      filterGames(library, { ...EMPTY_GAME_FILTER, kinds: ['freeform'] }).map((g) => g.id),
    ).toEqual(['a', 'c'])
  })

  it('filters by location', () => {
    expect(
      filterGames(library, { ...EMPTY_GAME_FILTER, locations: ['indoor'] }).map((g) => g.id),
    ).toEqual(['b'])
  })

  it('OR-combines multiple ticked options within a facet', () => {
    expect(
      filterGames(library, { ...EMPTY_GAME_FILTER, locations: ['outdoor', 'both'] }).map(
        (g) => g.id,
      ),
    ).toEqual(['a', 'c'])
  })

  it('combines facets (all facets must match)', () => {
    expect(
      filterGames(library, {
        query: 'quiz',
        kinds: ['quiz'],
        locations: ['indoor'],
        packs: [],
      }).map((g) => g.id),
    ).toEqual(['b'])
    expect(
      filterGames(library, { query: 'quiz', kinds: ['freeform'], locations: [], packs: [] }),
    ).toEqual([])
  })

  it('filters by preset pack via the game id, ignoring host/example games', () => {
    const packed: GameDef[] = [
      game({ id: 'qn-gk-quiz', title: 'Quiz' }), // quiz-night pack
      game({ id: 'party-tabu', title: 'Tabu' }), // party pack
      game({ id: 'mine', title: 'Eigenes' }), // no pack
    ]
    expect(
      filterGames(packed, { ...EMPTY_GAME_FILTER, packs: ['quiz-night'] }).map((g) => g.id),
    ).toEqual(['qn-gk-quiz'])
    // OR within the facet.
    expect(
      filterGames(packed, { ...EMPTY_GAME_FILTER, packs: ['quiz-night', 'party'] }).map(
        (g) => g.id,
      ),
    ).toEqual(['qn-gk-quiz', 'party-tabu'])
  })

  it('returns an empty list when nothing matches', () => {
    expect(filterGames(library, { ...EMPTY_GAME_FILTER, query: 'zzz' })).toEqual([])
  })

  it('handles an empty library', () => {
    expect(filterGames([], { ...EMPTY_GAME_FILTER, query: 'quiz' })).toEqual([])
  })

  it('preserves the original order', () => {
    expect(filterGames(library, EMPTY_GAME_FILTER).map((g) => g.id)).toEqual(['a', 'b', 'c'])
  })
})

describe('isFilterActive', () => {
  it('is false for the empty filter and a whitespace-only query', () => {
    expect(isFilterActive(EMPTY_GAME_FILTER)).toBe(false)
    expect(isFilterActive({ ...EMPTY_GAME_FILTER, query: '   ' })).toBe(false)
  })

  it('is true when any facet narrows the list', () => {
    expect(isFilterActive({ ...EMPTY_GAME_FILTER, query: 'a' })).toBe(true)
    expect(isFilterActive({ ...EMPTY_GAME_FILTER, kinds: ['quiz'] })).toBe(true)
    expect(isFilterActive({ ...EMPTY_GAME_FILTER, locations: ['indoor'] })).toBe(true)
    expect(isFilterActive({ ...EMPTY_GAME_FILTER, packs: ['quiz-night'] })).toBe(true)
  })
})

describe('missingGames', () => {
  const seeds = [game({ id: 'a' }), game({ id: 'b' }), game({ id: 'c' })]

  it('returns all candidates when the library is empty', () => {
    expect(missingGames([], seeds).map((g) => g.id)).toEqual(['a', 'b', 'c'])
  })

  it('returns nothing when every candidate is already present', () => {
    expect(missingGames(seeds, seeds)).toEqual([])
  })

  it('returns only the deleted seeds, in candidate order', () => {
    const kept = [game({ id: 'b' })]
    expect(missingGames(kept, seeds).map((g) => g.id)).toEqual(['a', 'c'])
  })

  it('ignores unrelated games the host added themselves', () => {
    const existing = [game({ id: 'a' }), game({ id: 'mine' })]
    expect(missingGames(existing, seeds).map((g) => g.id)).toEqual(['b', 'c'])
  })
})

describe('activeFacetCount', () => {
  it('counts ticked type, location and pack options, ignoring the query', () => {
    expect(activeFacetCount(EMPTY_GAME_FILTER)).toBe(0)
    expect(activeFacetCount({ ...EMPTY_GAME_FILTER, query: 'anything' })).toBe(0)
    expect(
      activeFacetCount({
        query: '',
        kinds: ['quiz'],
        locations: ['indoor', 'both'],
        packs: ['party'],
      }),
    ).toBe(4)
  })
})
