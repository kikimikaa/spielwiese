import type { ScoreEvent } from '../core/types'
import { freshWinId } from '../core/logic'

/**
 * Subscribes to genuinely-new game wins: a single fresh positive score event on
 * an enabled game (the same events the standings count). Seeds from the first
 * loaded state so a pre-existing win never fires on page load, and a reconnect
 * catch-up (several new at once) stays silent. Shared by the win toast and the
 * board sound cues so the detection lives in one place.
 */
export function useGameWins(onWin: (event: ScoreEvent) => void) {
  const { state } = useTournamentState()

  const wins = computed<ScoreEvent[]>(() => {
    const enabled = new Set(
      (state.value?.games ?? []).filter((g) => g.enabled !== false).map((g) => g.id),
    )
    return (state.value?.scoreEvents ?? []).filter(
      (e) => e.gameId && enabled.has(e.gameId) && e.delta > 0,
    )
  })

  const seen = new Set<string>()
  let initialized = false

  watch(
    wins,
    (current: ScoreEvent[]) => {
      if (!state.value) return
      const ids = current.map((e) => e.id)
      if (!initialized) {
        initialized = true
        for (const id of ids) seen.add(id)
        return
      }
      const fresh = freshWinId(seen, ids)
      // Track exactly the current win ids — event ids are one-shot UUIDs, so a
      // dropped one never returns; this keeps `seen` from growing over re-awards.
      seen.clear()
      for (const id of ids) seen.add(id)
      if (fresh) {
        const event = current.find((e) => e.id === fresh)
        if (event) onWin(event)
      }
    },
    { immediate: true },
  )
}
