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
 * The right-hand answers in a neutral display order for the board's answer pool.
 * Reuses the ordering game's neutral sort — a deterministic UTF-16 code-unit sort
 * that is unrelated to the pair order. (The board also renders these as a pooled
 * bag rather than a row-aligned column, so the pairing can't be read off either.)
 */
export function neutralRights(pairs: MatchSpec['pairs']): string[] {
  return neutralOrder(pairs.map((p) => p.right))
}
