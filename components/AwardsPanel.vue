<script setup lang="ts">
const props = defineProps<{ showWinner?: boolean }>()

const { awards, teamById, totals, tournamentWinner, isAwardRevealed, awardDetailArgs } =
  useTournamentState()

const winner = computed(() => teamById(tournamentWinner.value))
// Finished with points on the board but no single leader = a draw.
const isTie = computed(
  () => !winner.value && Object.values<number>(totals.value).some((p) => p > 0),
)
</script>

<template>
  <section class="stack" data-testid="awards-panel">
    <div
      v-if="props.showWinner && winner"
      class="card winner"
      :style="{ '--team': winner.color }"
      data-testid="winner"
    >
      <Confetti />
      <div class="muted">{{ $t('awards.winner') }}</div>
      <div class="winner-name">🏆 {{ winner.name }}</div>
      <div class="winner-score">{{ totals[winner.id] ?? 0 }} {{ $t('common.points') }}</div>
    </div>

    <div v-else-if="props.showWinner && isTie" class="card tie" data-testid="tie">
      <div class="tie-emoji" aria-hidden="true">🤝</div>
      <div class="tie-title">{{ $t('awards.draw') }}</div>
    </div>

    <div>
      <h2>{{ $t('awards.honorableMentions') }}</h2>
      <ul class="mentions">
        <li
          v-for="a in awards"
          :key="a.id"
          class="card mention"
          :class="{ revealed: isAwardRevealed(a.id) }"
          data-testid="award"
        >
          <span class="label">{{ $t(`awards.${a.id}.label`) }}</span>
          <span v-if="isAwardRevealed(a.id)" class="value" data-testid="award-value">
            {{ $t(`awards.${a.id}.detail`, awardDetailArgs(a)) }}
          </span>
          <span v-else class="value hidden" data-testid="award-hidden">
            {{ $t('awards.hidden') }}
          </span>
        </li>
        <li v-if="!awards.length" class="muted">{{ $t('common.none') }}</li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.winner {
  text-align: center;
  border-width: 3px;
  border-color: var(--team);
}

.tie {
  text-align: center;
}

.tie-emoji {
  font-size: clamp(2.5rem, 10vw, 4rem);
  line-height: 1;
}

.tie-title {
  font-weight: 800;
  font-size: clamp(2rem, 8vw, 3.5rem);
  color: var(--accent);
}

.winner-name {
  font-weight: 800;
  font-size: clamp(2rem, 8vw, 3.5rem);
  color: var(--team);
  line-height: 1.1;
}

.winner-score {
  font-weight: 700;
  font-size: 1.25rem;
}

.mentions {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.6rem;
}

.mention {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.5rem;
  align-items: baseline;
  padding: 0.9rem 1.1rem;
}

.mention.revealed {
  border-color: var(--accent);
}

.mention .label {
  font-weight: 700;
}

.mention .value {
  color: var(--ink-soft);
}

.mention .value.hidden {
  font-style: italic;
  opacity: 0.7;
}

/* A gentle pop when a winner is revealed. */
.mention.revealed .value {
  color: var(--ink);
  font-weight: 700;
  animation: reveal-pop 0.35s ease-out;
}

@keyframes reveal-pop {
  from {
    opacity: 0;
    transform: translateY(0.35rem);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .mention.revealed .value {
    animation: none;
  }
}
</style>
