<script setup lang="ts">
import type { Game } from '../core/types'

// Cute, dependency-free board stats — deliberately only things the big
// scoreboard doesn't already show: tournament progress and the tip ranking.
const { playableGames, predictionBoard, playerLabel } = useTournamentState()

const done = computed(() => playableGames.value.filter((g: Game) => g.status === 'done').length)
const total = computed(() => playableGames.value.length)
const progressPct = computed(() => (total.value ? Math.round((done.value / total.value) * 100) : 0))
</script>

<template>
  <div class="stats-grid">
    <section v-if="total" class="card stat">
      <div class="muted eyebrow">🎮 {{ $t('board.stats.progress') }}</div>
      <div class="track"><div class="fill" :style="{ width: `${progressPct}%` }" /></div>
      <div class="stat-label">{{ $t('board.stats.gamesProgress', { done, total }) }}</div>
    </section>

    <section v-if="predictionBoard.length" class="card stat" data-testid="prediction-board">
      <div class="muted eyebrow">🔮 {{ $t('board.leaderboard') }}</div>
      <ol class="ranks">
        <li v-for="p in predictionBoard.slice(0, 5)" :key="p.playerId">
          <span>{{ playerLabel(p.playerId) }}</span>
          <span class="pts">{{ p.points }}</span>
        </li>
      </ol>
    </section>
  </div>
</template>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
  gap: clamp(0.75rem, 2vw, 1.25rem);
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.track {
  height: 0.9rem;
  background: var(--surface-2);
  border-radius: 999px;
  overflow: hidden;
}

.fill {
  height: 100%;
  background: var(--accent);
  border-radius: 999px;
  transition: width 0.4s ease;
}

.stat-label {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.ranks {
  margin: 0;
  padding-left: 1.2rem;
  display: grid;
  gap: 0.3rem;
}

.ranks li {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.ranks .pts {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
</style>
