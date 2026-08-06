<script setup lang="ts">
import type { PredictionScope } from '../core/types'
import { AWARD_BETS } from '../core/constants'

const { t } = useI18n()
useHead({ title: () => `${t('nav.bets')} — ${t('app.name')}` })

const { state, teams, players, currentGame, playerById, playerLabel } = useTournamentState()
const { playerId, predict } = useGuest()

const me = computed(() => playerById(playerId.value))

const gameLocked = computed(() => Boolean(currentGame.value?.winnerTeamId))
// Tournament and award bets lock once the games have started.
const metaLocked = computed(() => state.value?.status !== 'setup' && state.value?.status !== 'draw')

function pickOf(scope: PredictionScope, refs: { gameId?: string; awardId?: string } = {}) {
  return (
    state.value?.predictions.find(
      (p) =>
        p.playerId === playerId.value &&
        p.scope === scope &&
        p.gameId === refs.gameId &&
        p.awardId === refs.awardId,
    )?.target ?? null
  )
}
</script>

<template>
  <div class="page">
    <AppHeader />

    <div v-if="!players.length" class="card" data-testid="bets-waiting">
      <h1>{{ $t('nav.bets') }}</h1>
      <p class="muted">{{ $t('join.waitingDraw') }}</p>
    </div>

    <div v-else-if="!me" class="card stack" data-testid="bets-identify">
      <h1>{{ $t('nav.bets') }}</h1>
      <p class="muted">{{ $t('bets.needIdentity') }}</p>
      <NuxtLink to="/join" class="btn btn-primary">{{ $t('nav.join') }}</NuxtLink>
    </div>

    <div v-else class="stack">
      <h1>{{ $t('nav.bets') }}</h1>

      <!-- Bet on the current game (only shown when the host has picked one). -->
      <section v-if="currentGame" class="card stack" data-testid="tip-game">
        <div class="label">{{ $t('bets.tipGameWinner', { game: currentGame.title }) }}</div>
        <div class="cluster">
          <button
            v-for="team in teams"
            :key="team.id"
            class="btn team-btn"
            :class="{ picked: pickOf('game', { gameId: currentGame.id }) === team.id }"
            :style="{ '--team': team.color }"
            :disabled="gameLocked"
            @click="predict('game', team.id, { gameId: currentGame.id })"
          >
            {{ team.name }}
          </button>
        </div>
        <p v-if="gameLocked" class="muted small">{{ $t('bets.locked') }}</p>
      </section>
      <section v-else class="card" data-testid="bets-no-game">
        <p class="muted">{{ $t('board.waiting') }}</p>
      </section>

      <!-- Tournament winner -->
      <section class="card stack" data-testid="tip-tournament">
        <div class="label">{{ $t('bets.tipTournamentWinner') }}</div>
        <div class="cluster">
          <button
            v-for="team in teams"
            :key="team.id"
            class="btn team-btn"
            :class="{ picked: pickOf('tournament') === team.id }"
            :style="{ '--team': team.color }"
            :disabled="metaLocked"
            @click="predict('tournament', team.id)"
          >
            {{ team.name }}
          </button>
        </div>
        <p class="muted small">{{ metaLocked ? $t('bets.locked') : $t('bets.untilStart') }}</p>
      </section>

      <!-- Award bets: a few honorable mentions, by team or by person -->
      <section
        v-for="bet in AWARD_BETS"
        :key="bet.awardId"
        class="card stack"
        :data-testid="`bet-award-${bet.awardId}`"
      >
        <div class="label">{{ $t(`awards.${bet.awardId}.label`) }}</div>
        <div class="cluster">
          <template v-if="bet.target === 'team'">
            <button
              v-for="team in teams"
              :key="team.id"
              class="btn team-btn"
              :class="{ picked: pickOf('award', { awardId: bet.awardId }) === team.id }"
              :style="{ '--team': team.color }"
              :disabled="metaLocked"
              @click="predict('award', team.id, { awardId: bet.awardId })"
            >
              {{ team.name }}
            </button>
          </template>
          <template v-else>
            <button
              v-for="p in players"
              :key="p.id"
              class="btn person-btn"
              :class="{ picked: pickOf('award', { awardId: bet.awardId }) === p.id }"
              :disabled="metaLocked"
              @click="predict('award', p.id, { awardId: bet.awardId })"
            >
              {{ playerLabel(p.id) }}
            </button>
          </template>
        </div>
        <p class="muted small">{{ metaLocked ? $t('bets.locked') : $t('bets.untilStart') }}</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.small {
  font-size: 0.85rem;
}

.team-btn {
  border-left: 6px solid var(--team);
  font-weight: 700;
}

.team-btn.picked {
  background: var(--team);
  color: #fff;
  border-color: var(--team);
}

.person-btn {
  font-weight: 700;
}

.person-btn.picked {
  background: var(--accent);
  color: var(--accent-ink);
  border-color: var(--accent);
}
</style>
