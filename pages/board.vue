<script setup lang="ts">
import { optionLetter } from '../core/choice'

const { t } = useI18n()
useHead({ title: () => `${t('nav.board')} — ${t('app.name')}` })

const {
  state,
  connected,
  teams,
  totals,
  leader,
  currentGame,
  upcoming,
  quiz,
  currentQuestion,
  currentEstimate,
  currentChoice,
} = useTournamentState()
const { enabled: sun, toggle: toggleSun } = useSunMode()

// The current game's reveal — a quiz question or an estimate solution — shown as
// one block that hides the answer behind a "?" until the host reveals it. Null
// unless the active game actually has something revealable.
const reveal = computed(() => {
  const g = currentGame.value
  if (g?.kind === 'quiz' && currentQuestion.value) {
    return {
      testid: 'board-quiz',
      answerTestid: 'board-quiz-answer',
      prompt: currentQuestion.value.question,
      answer: currentQuestion.value.answer,
    }
  }
  const e = currentEstimate.value
  if (g?.kind === 'estimate' && e?.solution) {
    return {
      testid: 'board-estimate',
      answerTestid: 'board-estimate-solution',
      prompt: e.prompt,
      answer: e.unit ? `${e.solution} ${e.unit}` : e.solution,
    }
  }
  return null
})

// Multiple choice renders its options as a list (not a single answer), so it gets
// its own block rather than sharing the reveal shape above.
const choice = computed(() => (currentGame.value?.kind === 'choice' ? currentChoice.value : null))

// Whether the active game is a content type that shows a prompt but has nothing
// authored yet — then the board shows a "waiting" line instead of an empty gap.
const contentKind = computed(() => {
  const k = currentGame.value?.kind
  return k === 'quiz' || k === 'estimate' || k === 'choice'
})

const showAwards = computed(
  () => state.value?.status === 'awards' || state.value?.status === 'finished',
)
const pause = computed(() => state.value?.pause ?? 'none')

// On the final game (nothing left to play) we clear the bottom of the board to
// build anticipation for the ceremony — no stats, no leaderboard.
const isLastGame = computed(() => Boolean(currentGame.value) && upcoming.value.length === 0)
</script>

<template>
  <div class="page board">
    <BoardWinToast />
    <header class="topbar">
      <div class="cluster">
        <AppBrand />
        <span class="pill pill-dot conn" :class="{ on: connected }">{{ $t('board.live') }}</span>
      </div>
      <div class="cluster">
        <button
          class="btn sun"
          :class="{ active: sun }"
          data-testid="sun-toggle"
          :aria-pressed="sun"
          @click="toggleSun"
        >
          ☀️ {{ $t('board.sunMode') }}
        </button>
        <LangToggle />
      </div>
    </header>

    <!-- Pre-ceremony suspense: hide the scores entirely to build excitement. -->
    <section
      v-if="pause === 'suspense' && !showAwards"
      class="card curtain"
      data-testid="board-suspense"
    >
      <div class="curtain-emoji" aria-hidden="true">🏆</div>
      <h1 class="curtain-title">{{ $t('board.suspense') }}</h1>
    </section>

    <template v-else>
      <!-- Honorable mentions are about the side awards, not the standings — the
           final score stays hidden until the ceremony (status 'finished'). -->
      <ScoreBoard
        v-if="state?.status !== 'awards'"
        :teams="teams"
        :totals="totals"
        :leader-id="leader"
      />

      <template v-if="showAwards">
        <AwardsPanel :show-winner="state?.status === 'finished'" class="mt" />
      </template>

      <!-- Short break: scores stay up, but pause the game/stats. -->
      <section v-else-if="pause === 'break'" class="card curtain mt" data-testid="board-paused">
        <div class="curtain-emoji" aria-hidden="true">⏸️</div>
        <h1 class="curtain-title">{{ $t('board.paused') }}</h1>
        <p class="muted">{{ $t('board.pausedHint') }}</p>
      </section>

      <!-- Right after the draw: show the teams on the big screen -->
      <section v-else-if="state?.status === 'draw'" class="mt">
        <div class="muted eyebrow">{{ $t('common.teams') }}</div>
        <BoardTeams />
      </section>

      <template v-else>
        <section class="card current mt" data-testid="current-game">
          <div class="muted eyebrow">{{ $t('board.currentGame') }}</div>
          <template v-if="currentGame">
            <h1 class="game-title">{{ currentGame.title }}</h1>
            <GameTags :game="currentGame" />
            <p v-if="currentGame.rules" class="rules">{{ currentGame.rules }}</p>

            <div v-if="reveal" class="quiz" :data-testid="reveal.testid">
              <p class="quiz-q">{{ reveal.prompt }}</p>
              <p v-if="quiz.revealed" class="quiz-a" :data-testid="reveal.answerTestid">
                {{ reveal.answer }}
              </p>
              <p v-else class="quiz-a quiz-hidden" aria-hidden="true">?</p>
            </div>
            <div v-else-if="choice" class="quiz" data-testid="board-choice">
              <p class="quiz-q">{{ choice.prompt }}</p>
              <ul class="choices">
                <li
                  v-for="(opt, i) in choice.options"
                  :key="i"
                  class="choice"
                  :class="{
                    correct: quiz.revealed && i === choice.correct,
                    dim: quiz.revealed && i !== choice.correct,
                  }"
                  :data-testid="
                    quiz.revealed && i === choice.correct ? 'board-choice-correct' : undefined
                  "
                >
                  <span class="choice-key" aria-hidden="true">{{ optionLetter(i) }}</span>
                  <span class="choice-text">{{ opt }}</span>
                </li>
              </ul>
            </div>
            <p v-else-if="contentKind && !currentGame.rules" class="muted rules">
              {{ $t('board.waiting') }}
            </p>
          </template>
          <template v-else>
            <h1 class="game-title">{{ $t('board.noGame') }}</h1>
            <p class="muted">{{ $t('board.waiting') }}</p>
          </template>
        </section>

        <BoardStats v-if="!isLastGame" class="stats" data-testid="board-stats" />
      </template>
    </template>
  </div>
</template>

<style scoped>
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.conn {
  color: var(--danger);
}
.conn.on {
  color: var(--accent);
}

.sun.active {
  border-color: var(--accent);
  background: var(--surface-2);
}

.mt {
  margin-top: clamp(1rem, 3vw, 1.75rem);
}

/* A bit more breathing room between the current game and the stats. */
.stats {
  margin-top: clamp(1.75rem, 6vw, 3.5rem);
}

.curtain {
  text-align: center;
  padding: clamp(2rem, 8vw, 4rem) 1rem;
}

.curtain-emoji {
  font-size: clamp(3rem, 14vw, 6rem);
  line-height: 1;
}

.curtain-title {
  font-size: clamp(2rem, 8vw, 3.5rem);
  font-weight: 800;
  margin: 0.5rem 0 0.25rem;
}

.eyebrow {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
}

.game-title {
  font-size: clamp(2rem, 7vw, 3.25rem);
  font-weight: 800;
}

.rules {
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  margin: 0.75rem 0 0;
}

.quiz {
  margin-top: clamp(1rem, 3vw, 1.75rem);
  border-top: 1px solid var(--line);
  padding-top: clamp(1rem, 3vw, 1.75rem);
}

.quiz-q {
  font-size: clamp(1.5rem, 5vw, 2.5rem);
  font-weight: 800;
  margin: 0;
  text-wrap: balance;
}

.quiz-a {
  font-size: clamp(1.25rem, 4vw, 2rem);
  font-weight: 700;
  color: var(--accent);
  margin: 0.75rem 0 0;
  text-wrap: balance;
}

.quiz-hidden {
  color: var(--ink-soft);
}

.choices {
  list-style: none;
  margin: 0.75rem 0 0;
  padding: 0;
  display: grid;
  gap: clamp(0.4rem, 1.5vw, 0.75rem);
}

.choice {
  display: flex;
  gap: 0.75rem;
  align-items: baseline;
  font-size: clamp(1.15rem, 3.5vw, 1.9rem);
  font-weight: 700;
  transition:
    opacity 0.2s,
    color 0.2s;
}

.choice-key {
  color: var(--ink-soft);
  min-width: 1.6rem;
}

.choice.correct {
  color: var(--accent);
}

.choice.correct .choice-key {
  color: var(--accent);
}

/* Once revealed, fade the wrong options so the correct one stands out. */
.choice.dim {
  opacity: 0.4;
}
</style>
