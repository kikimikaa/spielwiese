<script setup lang="ts">
import type { ScoreEvent } from '../core/types'
import { freshWinId } from '../core/logic'

// A small, self-clearing celebration on the board each time a game is won —
// smaller than the final ceremony, just a quick "team X scored a point".
const CELEBRATION_MS = 4500

const { state, teamById } = useTournamentState()

// Wins that count: positive score events tied to an enabled game — the same
// events the standings use, so the toast never celebrates a point the scoreboard
// doesn't award.
const wins = computed<ScoreEvent[]>(() => {
  const enabled = new Set(
    (state.value?.games ?? []).filter((g) => g.enabled !== false).map((g) => g.id),
  )
  return (state.value?.scoreEvents ?? []).filter(
    (e) => e.gameId && enabled.has(e.gameId) && e.delta > 0,
  )
})

const celebrating = ref<{ name: string; color: string; points: number } | null>(null)
// Win ids already accounted for. Seeded from the first loaded state (so a
// pre-existing win never celebrates on page load); freshWinId then fires only
// on a genuinely new, single win.
const seen = new Set<string>()
let initialized = false
let timer: ReturnType<typeof setTimeout> | null = null

function celebrate(event: ScoreEvent) {
  const team = teamById(event.teamId)
  if (!team) return
  celebrating.value = { name: team.name, color: team.color, points: event.delta }
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => (celebrating.value = null), CELEBRATION_MS)
}

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
    for (const id of ids) seen.add(id)
    if (fresh) {
      const event = current.find((e) => e.id === fresh)
      if (event) celebrate(event)
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})
</script>

<template>
  <Transition name="pop">
    <div
      v-if="celebrating"
      class="win-toast card"
      :style="{ '--team': celebrating.color }"
      role="status"
      data-testid="win-toast"
    >
      <span class="emoji" aria-hidden="true">🎉</span>
      <span class="msg">{{ $t('board.gameWon', { team: celebrating.name }) }}</span>
      <span class="pts">+{{ celebrating.points }} {{ $t('common.point') }}</span>
    </div>
  </Transition>
</template>

<style scoped>
.win-toast {
  position: fixed;
  top: clamp(0.75rem, 3vw, 1.5rem);
  left: 50%;
  transform: translateX(-50%);
  z-index: 40;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 1.1rem;
  border-left: 6px solid var(--team);
  max-width: min(92vw, 34rem);
}

.emoji {
  font-size: 1.5rem;
  line-height: 1;
}

.msg {
  font-weight: 800;
  font-size: clamp(1rem, 3vw, 1.35rem);
}

.pts {
  margin-left: auto;
  font-weight: 700;
  color: var(--team);
  white-space: nowrap;
}

.pop-enter-active {
  transition:
    transform 0.25s ease,
    opacity 0.25s ease;
}
.pop-leave-active {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translate(-50%, -0.6rem);
}

@media (prefers-reduced-motion: reduce) {
  .pop-enter-active,
  .pop-leave-active {
    transition: none;
  }
}
</style>
