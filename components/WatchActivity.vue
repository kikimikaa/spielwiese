<script setup lang="ts">
import type { Game, ScoreEvent } from '../core/types'

// A light "recent results" feed for the spectator view: the latest game wins,
// newest first, derived from the score-event log. Purely presentational.
const { recentActivity, teamById, games } = useTournamentState()

// The game's current title, falling back to the title stored on the win event.
const gameTitle = (event: ScoreEvent) =>
  games.value.find((g: Game) => g.id === event.gameId)?.title ?? event.note ?? ''
</script>

<template>
  <section v-if="recentActivity.length" class="card activity" data-testid="watch-activity">
    <div class="muted eyebrow">{{ $t('watch.activity.title') }}</div>
    <ul class="feed">
      <li v-for="event in recentActivity" :key="event.id" class="row" data-testid="activity-row">
        <span class="dot" :style="{ '--team': teamById(event.teamId)?.color }" aria-hidden="true" />
        <span class="team team-text" :style="{ '--team': teamById(event.teamId)?.color }">
          {{ teamById(event.teamId)?.name }}
        </span>
        <span class="game muted">{{ gameTitle(event) }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.activity {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.eyebrow {
  margin-bottom: 0;
}

.feed {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.4rem;
}

.row {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
}

.dot {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  background: var(--team);
  align-self: center;
  flex: none;
}

.team {
  font-weight: 700;
}

.game {
  margin-left: auto;
  text-align: right;
  text-wrap: balance;
}
</style>
