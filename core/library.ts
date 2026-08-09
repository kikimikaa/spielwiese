// Pure game-library filtering. Shared shape between the host UI and its tests;
// no framework or state dependency so it can be unit-tested in isolation.
import type { GameDef, GameKind, GameLocation } from './types'
import { packOfGameId } from './presets'

export interface GameFilter {
  /** Free-text match against title + short description. */
  query: string
  /** Selected game types; empty means "any type". */
  kinds: GameKind[]
  /** Selected locations; empty means "any location". */
  locations: GameLocation[]
  /** Selected preset packs; empty means "any pack". */
  packs: string[]
}

/** A fresh, unrestricted filter — new arrays each call so instances never alias. */
export function emptyGameFilter(): GameFilter {
  return { query: '', kinds: [], locations: [], packs: [] }
}

export const EMPTY_GAME_FILTER: GameFilter = emptyGameFilter()

/** A missing `kind` is the default freeform game, so filtering treats it as such. */
function gameKind(game: GameDef): GameKind {
  return game.kind ?? 'freeform'
}

function matchesQuery(game: GameDef, query: string): boolean {
  return game.title.toLowerCase().includes(query) || game.short.toLowerCase().includes(query)
}

/** A game's pack matches when no pack is selected, or its id belongs to a selected one. */
function matchesPack(game: GameDef, packs: string[]): boolean {
  if (!packs.length) return true
  const pack = packOfGameId(game.id)
  return pack !== null && packs.includes(pack)
}

/**
 * Narrows the library by text query (title + short, case- and space-insensitive)
 * and the type / location / preset-pack facets. Within a facet the ticked options
 * are OR-ed (an empty facet imposes no restriction); across facets everything must
 * match. Order is preserved.
 */
export function filterGames(games: GameDef[], filter: GameFilter): GameDef[] {
  const query = filter.query.trim().toLowerCase()
  return games.filter((g) => {
    if (filter.kinds.length && !filter.kinds.includes(gameKind(g))) return false
    if (filter.locations.length && !filter.locations.includes(g.location)) return false
    if (!matchesPack(g, filter.packs)) return false
    if (query && !matchesQuery(g, query)) return false
    return true
  })
}

/** Whether any facet is narrowing the list — drives the "clear filter" affordance. */
export function isFilterActive(filter: GameFilter): boolean {
  return (
    filter.query.trim() !== '' ||
    filter.kinds.length > 0 ||
    filter.locations.length > 0 ||
    filter.packs.length > 0
  )
}

/** How many facet options are ticked — shown as a badge on the collapsed filter toggle. */
export function activeFacetCount(filter: GameFilter): number {
  return filter.kinds.length + filter.locations.length + filter.packs.length
}

/**
 * Candidate games not yet present by id. Used to top up the library with the
 * example seeds the host is missing — re-adding ones they deleted — without
 * duplicating or disturbing the games they already have. Candidate order is kept.
 */
export function missingGames(existing: GameDef[], candidates: GameDef[]): GameDef[] {
  const present = new Set(existing.map((g) => g.id))
  return candidates.filter((g) => !present.has(g.id))
}
