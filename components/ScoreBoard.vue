<script setup lang="ts">
import type { Team } from '../core/types'

defineProps<{
  teams: Team[]
  totals: Record<string, number>
  leaderId: string | null
}>()
</script>

<template>
  <div class="board-grid" data-testid="scoreboard">
    <div
      v-for="t in teams"
      :key="t.id"
      class="team"
      :class="{ lead: leaderId === t.id }"
      :style="{ '--team': t.color }"
      data-testid="team-score"
    >
      <div class="bar" aria-hidden="true" />
      <div class="name">{{ t.name }}</div>
      <div class="score">{{ totals[t.id] ?? 0 }}</div>
    </div>
  </div>
</template>

<style scoped>
.board-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
  gap: clamp(0.75rem, 2vw, 1.25rem);
}

.team {
  position: relative;
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: clamp(1rem, 3vw, 1.75rem);
  box-shadow: var(--shadow);
  text-align: center;
}

.team.lead {
  border-color: var(--team);
  border-width: 3px;
}

.bar {
  position: absolute;
  inset: 0 0 auto 0;
  height: 8px;
  background: var(--team);
}

.name {
  font-weight: 700;
  font-size: clamp(1.1rem, 3.5vw, 1.6rem);
  margin-top: 0.4rem;
}

.score {
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: var(--team);
  font-size: clamp(3.5rem, 16vw, 9rem);
  line-height: 1;
}
</style>
