// Matching-game helpers: pure, framework-free, shared by the host editor, the
// board display and the config sanitizer.
import type { MatchSpec } from './types'
import { neutralOrder } from './ranking'

/** A matching game needs at least this many pairs to be worth playing. */
export const MIN_MATCH_PAIRS = 3

/** Whether a matching game is complete enough to save/play: a prompt and enough pairs. */
export function isMatchComplete(spec: MatchSpec): boolean {
  return spec.prompt.trim().length > 0 && spec.pairs.length >= MIN_MATCH_PAIRS
}

/**
 * The right-hand column in a neutral display order, so the board can show the two
 * columns without lining the pairs up (which would give the answer away). Reuses
 * the ordering game's neutral shuffle — deterministic on every client and never
 * the correct order.
 */
export function neutralRights(pairs: MatchSpec['pairs']): string[] {
  return neutralOrder(pairs.map((p) => p.right))
}
