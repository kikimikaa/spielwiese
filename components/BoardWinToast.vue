<script setup lang="ts">
import type { ScoreEvent } from '../core/types'

// A small, self-clearing celebration on the board each time a game is won —
// smaller than the final ceremony, just a quick "team X scored a point".
const CELEBRATION_MS = 4500

const { teamById } = useTournamentState()

const celebrating = ref<{ name: string; color: string; points: number } | null>(null)
let timer: ReturnType<typeof setTimeout> | null = null

useGameWins((event: ScoreEvent) => {
  const team = teamById(event.teamId)
  if (!team) return
  celebrating.value = { name: team.name, color: team.color, points: event.delta }
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => (celebrating.value = null), CELEBRATION_MS)
})

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
      <span class="pts team-text">+{{ celebrating.points }} {{ $t('common.point') }}</span>
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
