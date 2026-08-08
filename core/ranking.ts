// Ordering-game helpers: pure, framework-free, shared by the host editor, the
// board display and the config sanitizer.
import type { RankingSpec } from './types'

/** An ordering needs at least this many items to be more than a yes/no choice. */
export const MIN_RANKING_ITEMS = 3

/** Whether a ranking is complete enough to save/play: a prompt and enough items. */
export function isRankingComplete(spec: RankingSpec): boolean {
  return spec.prompt.trim().length > 0 && spec.items.length >= MIN_RANKING_ITEMS
}

/**
 * A neutral display order for the items before the answer is revealed: a stable
 * code-point sort, deterministic on every client and independent of the stored
 * (correct) order, so it never gives the ranking away.
 */
export function neutralOrder(items: string[]): string[] {
  return [...items].sort()
}
