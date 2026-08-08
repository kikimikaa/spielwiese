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
 * A neutral display order for the items before the answer is revealed:
 * deterministic on every client (a stable UTF-16 code-unit sort) and never the
 * stored correct order. If the sort happens to coincide with the correct order
 * (e.g. the answer is itself alphabetical), it's rotated by one so the board
 * still can't show the exact ranking.
 */
export function neutralOrder(items: string[]): string[] {
  const sorted = [...items].sort()
  const matchesAnswer = sorted.every((item, i) => item === items[i])
  if (matchesAnswer && sorted.length > 1) sorted.push(sorted.shift() as string)
  return sorted
}
