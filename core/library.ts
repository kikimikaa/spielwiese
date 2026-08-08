// Pure game-library filtering. Shared shape between the host UI and its tests;
// no framework or state dependency so it can be unit-tested in isolation.
import type { GameDef, GameKind, GameLocation } from './types'

/** 'all' on a facet means "don't restrict by it". */
export type KindFacet = GameKind | 'all'
export type LocationFacet = GameLocation | 'all'

export interface GameFilter {
  /** Free-text match against title + short description. */
  query: string
  kind: KindFacet
  location: LocationFacet
}

export const EMPTY_GAME_FILTER: GameFilter = { query: '', kind: 'all', location: 'all' }

/** A missing `kind` is the default freeform game, so filtering treats it as such. */
function gameKind(game: GameDef): GameKind {
  return game.kind ?? 'freeform'
}

function matchesQuery(game: GameDef, query: string): boolean {
  return game.title.toLowerCase().includes(query) || game.short.toLowerCase().includes(query)
}

/**
 * Narrows the library by text query (title + short, case- and space-insensitive)
 * and the type / location facets. Order is preserved.
 */
export function filterGames(games: GameDef[], filter: GameFilter): GameDef[] {
  const query = filter.query.trim().toLowerCase()
  return games.filter((g) => {
    if (filter.kind !== 'all' && gameKind(g) !== filter.kind) return false
    if (filter.location !== 'all' && g.location !== filter.location) return false
    if (query && !matchesQuery(g, query)) return false
    return true
  })
}

/** Whether any facet is narrowing the list — drives the "clear filter" affordance. */
export function isFilterActive(filter: GameFilter): boolean {
  return filter.query.trim() !== '' || filter.kind !== 'all' || filter.location !== 'all'
}
