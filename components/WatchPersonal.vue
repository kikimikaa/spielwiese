<script setup lang="ts">
import { predictionStanding } from '../core/logic'

// A watcher who has also joined as a guest sees their own live prediction score
// here — turning the read-only board into something personal. Pure spectators
// (no guest identity on this device) get a gentle nudge to join and play along.
const { predictionBoard } = useTournamentState()
const { playerId } = useGuest()

const standing = computed(() =>
  playerId.value ? predictionStanding(predictionBoard.value, playerId.value) : null,
)
</script>

<template>
  <section v-if="playerId" class="card personal" data-testid="watch-personal">
    <div class="muted eyebrow">{{ $t('watch.personal.title') }}</div>
    <p v-if="standing" class="standing" aria-live="polite">
      <span class="pts">{{ standing.points }}</span>
      <span class="unit">{{ $t('common.points') }}</span>
      <span class="rank">{{
        $t('watch.personal.rank', { rank: standing.rank, total: standing.total })
      }}</span>
    </p>
    <p v-else class="muted">{{ $t('watch.personal.noTips') }}</p>
  </section>

  <section v-else class="card personal join-hint" data-testid="watch-join-hint">
    <p class="muted">{{ $t('watch.personal.joinHint') }}</p>
    <NuxtLink to="/join" class="btn btn-primary" data-testid="watch-join-link">
      {{ $t('nav.join') }}
    </NuxtLink>
  </section>
</template>

<style scoped>
.personal {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.eyebrow {
  margin-bottom: 0;
}

.standing {
  margin: 0;
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.pts {
  font-weight: 800;
  font-size: 1.6rem;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
}

.rank {
  margin-left: auto;
  color: var(--ink-soft);
  font-weight: 700;
}

.join-hint {
  align-items: flex-start;
  gap: 0.6rem;
}
</style>
