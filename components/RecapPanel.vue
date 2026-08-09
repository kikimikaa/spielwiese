<script setup lang="ts">
import type { ProgressionStep, TeamRecap } from '../core/analytics'

// End-of-event recap: how the standings evolved. Each team gets a sparkline of
// its cumulative points across the games, plus headline drama stats. Purely
// derived from the recap helper — shown as part of the finished ceremony.
const { recap, teamById } = useTournamentState()

// Sparkline canvas in user units; the SVG scales to its box via the viewBox.
const CHART_W = 100
const CHART_H = 28

const teamName = (id: string) => teamById(id)?.name ?? ''
const teamColor = (id: string) => teamById(id)?.color ?? 'var(--accent)'

// Highest final score sets the vertical scale so every sparkline shares one axis.
const maxPoints = computed(() => Math.max(1, ...recap.value.teams.map((t: TeamRecap) => t.wins)))

// Teams in final standing order (most wins first, then name for a stable tie).
const standings = computed(() =>
  [...recap.value.teams].sort(
    (a: TeamRecap, b: TeamRecap) =>
      b.wins - a.wins || teamName(a.teamId).localeCompare(teamName(b.teamId)),
  ),
)

/** Cumulative points after each game, starting from 0. */
function series(teamId: string): number[] {
  return [0, ...recap.value.steps.map((s: ProgressionStep) => s.totals[teamId] ?? 0)]
}

/** The team's cumulative points as an SVG polyline "x,y x,y …" string. */
function sparkline(teamId: string): string {
  const points = series(teamId)
  const segments = points.length - 1
  return points
    .map((value, i) => {
      const x = segments === 0 ? 0 : (i / segments) * CHART_W
      const y = CHART_H - (value / maxPoints.value) * CHART_H
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}
</script>

<template>
  <section v-if="recap.gamesPlayed" class="stack recap" data-testid="recap-panel">
    <h2>{{ $t('recap.title') }}</h2>

    <div class="stats">
      <div class="card stat" data-testid="recap-games">
        <div class="stat-value">{{ recap.gamesPlayed }}</div>
        <div class="muted stat-label">{{ $t('recap.gamesPlayed') }}</div>
      </div>
      <div class="card stat" data-testid="recap-lead-changes">
        <div class="stat-value">{{ recap.leadChanges }}</div>
        <div class="muted stat-label">{{ $t('recap.leadChanges') }}</div>
      </div>
      <div class="card stat" data-testid="recap-biggest-lead">
        <div class="stat-value">
          <template v-if="recap.biggestLead">
            {{
              $t('recap.leadBy', {
                team: teamName(recap.biggestLead.teamId),
                margin: recap.biggestLead.margin,
              })
            }}
          </template>
          <template v-else>—</template>
        </div>
        <div class="muted stat-label">{{ $t('recap.biggestLead') }}</div>
      </div>
    </div>

    <ul class="journeys">
      <li
        v-for="t in standings"
        :key="t.teamId"
        class="card journey"
        :style="{ '--team': teamColor(t.teamId) }"
        data-testid="recap-team"
      >
        <div class="journey-head">
          <span class="dot" aria-hidden="true" />
          <span class="team-name">{{ teamName(t.teamId) }}</span>
          <span class="team-points">{{ t.wins }} {{ $t('common.points') }}</span>
        </div>

        <!-- Decorative: the team's point total is already stated as text above. -->
        <svg
          class="spark"
          :viewBox="`0 0 ${CHART_W} ${CHART_H}`"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <polyline :points="sparkline(t.teamId)" />
        </svg>

        <div class="journey-meta muted">
          <span v-if="t.longestStreak > 1" class="badge" data-testid="recap-streak">
            🔥 {{ $t('recap.streak', { n: t.longestStreak }) }}
          </span>
          <span v-if="t.keyGame" class="key-game">
            {{ $t('recap.keyGame', { title: t.keyGame.title }) }}
          </span>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 9rem), 1fr));
  gap: 0.75rem;
}

.stat {
  text-align: center;
  padding: 0.9rem 1rem;
}

.stat-value {
  font-weight: 800;
  font-size: clamp(1.5rem, 4vw, 2.25rem);
  line-height: 1.1;
  color: var(--accent);
}

.stat-label {
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.journeys {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.6rem;
}

.journey {
  border-left: 4px solid var(--team);
}

.journey-head {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
}

.dot {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
  background: var(--team);
  align-self: center;
}

.team-name {
  font-weight: 700;
  font-size: 1.15rem;
}

.team-points {
  margin-left: auto;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.spark {
  width: 100%;
  height: 2.5rem;
  margin: 0.6rem 0 0.4rem;
  overflow: visible;
}

.spark polyline {
  fill: none;
  stroke: var(--team);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}

.journey-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  font-size: 0.9rem;
}

.badge {
  font-weight: 700;
}
</style>
