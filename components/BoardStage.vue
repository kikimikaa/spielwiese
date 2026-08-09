<script setup lang="ts">
import { optionLetter } from '../core/choice'
import { neutralOrder } from '../core/ranking'
import { neutralRights } from '../core/match'

// The live tournament display shared by the big-screen board (/board) and the
// read-only spectator view (/watch): scoreboard, current game with its reveal,
// awards, and the pause/suspense/draw states. Purely presentational — no host
// controls and no guest input, so it is safe to show to anyone.
const { t } = useI18n()

const {
  state,
  teams,
  totals,
  leader,
  currentGame,
  upcoming,
  quiz,
  currentQuestion,
  currentEstimate,
  currentChoice,
  currentRanking,
  currentTrueFalse,
  currentMatch,
  currentBuzzer,
} = useTournamentState()

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
  const tf = currentTrueFalse.value
  if (g?.kind === 'truefalse' && tf) {
    return {
      testid: 'board-truefalse',
      answerTestid: 'board-truefalse-answer',
      prompt: tf.statement,
      answer: t(tf.answer ? 'truefalse.true' : 'truefalse.false'),
    }
  }
  const b = currentBuzzer.value
  if (g?.kind === 'buzzer' && b) {
    return {
      testid: 'board-buzzer',
      answerTestid: 'board-buzzer-answer',
      prompt: b.prompt,
      answer: b.answer,
    }
  }
  return null
})

// Multiple choice renders its options as a list (not a single answer), so it gets
// its own block rather than sharing the reveal shape above.
const choice = computed(() => (currentGame.value?.kind === 'choice' ? currentChoice.value : null))

// Ordering: show the items neutrally (alphabetical) until revealed, then in the
// stored correct order. The neutral order never leaks the answer.
const ranking = computed(() => {
  const r = currentGame.value?.kind === 'ranking' ? currentRanking.value : null
  if (!r) return null
  return { prompt: r.prompt, items: quiz.value.revealed ? r.items : neutralOrder(r.items) }
})

// Matching: show the terms in order and the answers as a neutrally-ordered pool
// until the host reveals the correct pairing.
const match = computed(() => {
  const m = currentGame.value?.kind === 'match' ? currentMatch.value : null
  if (!m) return null
  return { prompt: m.prompt, pairs: m.pairs, rights: neutralRights(m.pairs) }
})

// Whether the active game is a content type that shows a prompt but has nothing
// authored yet — then the board shows a "waiting" line instead of an empty gap.
const contentKind = computed(() => {
  const k = currentGame.value?.kind
  return (
    k === 'quiz' ||
    k === 'estimate' ||
    k === 'choice' ||
    k === 'ranking' ||
    k === 'truefalse' ||
    k === 'match' ||
    k === 'buzzer'
  )
})

const showAwards = computed(
  () => state.value?.status === 'awards' || state.value?.status === 'finished',
)
const pause = computed(() => state.value?.pause ?? 'none')

// The single mutually-exclusive block shown below the scoreboard. Fading between
// these (rather than a hard cut) keeps the big screen calm as the host moves
// between games, breaks and the ceremony.
type Phase = 'suspense' | 'awards' | 'break' | 'draw' | 'game'
const phase = computed<Phase>(() => {
  if (pause.value === 'suspense' && !showAwards.value) return 'suspense'
  if (showAwards.value) return 'awards'
  if (pause.value === 'break') return 'break'
  if (state.value?.status === 'draw') return 'draw'
  return 'game'
})
// Suspense hides the scores for the reveal; the awards ceremony replaces them.
const showScoreboard = computed(
  () => phase.value !== 'suspense' && state.value?.status !== 'awards',
)

// On the final game (nothing left to play) we clear the bottom of the board to
// build anticipation for the ceremony — no stats, no leaderboard.
const isLastGame = computed(() => Boolean(currentGame.value) && upcoming.value.length === 0)
</script>

<template>
  <div class="stage">
    <BoardWinToast />

    <!-- Honorable mentions are about the side awards, not the standings — the
         final score stays hidden until the ceremony, and suspense hides it too. -->
    <ScoreBoard v-if="showScoreboard" :teams="teams" :totals="totals" :leader-id="leader" />

    <Transition name="fade" mode="out-in">
      <!-- Pre-ceremony suspense: hide the scores entirely to build excitement. -->
      <section
        v-if="phase === 'suspense'"
        key="suspense"
        class="card curtain"
        data-testid="board-suspense"
      >
        <div class="curtain-emoji" aria-hidden="true">🏆</div>
        <h1 class="curtain-title">{{ $t('board.suspense') }}</h1>
      </section>

      <div v-else-if="phase === 'awards'" key="awards">
        <AwardsPanel :show-winner="state?.status === 'finished'" class="mt" />
        <RecapPanel v-if="state?.status === 'finished'" class="mt" />
      </div>

      <!-- Short break: scores stay up, but pause the game/stats. -->
      <section
        v-else-if="phase === 'break'"
        key="break"
        class="card curtain mt"
        data-testid="board-paused"
      >
        <div class="curtain-emoji" aria-hidden="true">⏸️</div>
        <h1 class="curtain-title">{{ $t('board.paused') }}</h1>
        <p class="muted">{{ $t('board.pausedHint') }}</p>
      </section>

      <!-- Right after the draw: show the teams on the big screen -->
      <section v-else-if="phase === 'draw'" key="draw" class="mt">
        <div class="muted eyebrow">{{ $t('common.teams') }}</div>
        <BoardTeams />
      </section>

      <div v-else key="game">
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
            <div v-else-if="ranking" class="quiz" data-testid="board-ranking">
              <p class="quiz-q">{{ ranking.prompt }}</p>
              <component
                :is="quiz.revealed ? 'ol' : 'ul'"
                class="ranking"
                :class="{ revealed: quiz.revealed }"
                :data-testid="quiz.revealed ? 'board-ranking-ordered' : 'board-ranking-neutral'"
              >
                <li v-for="(item, i) in ranking.items" :key="i" class="rank-item">
                  {{ item }}
                </li>
              </component>
            </div>
            <div v-else-if="match" class="quiz" data-testid="board-match">
              <p class="quiz-q">{{ match.prompt }}</p>
              <ul v-if="quiz.revealed" class="match-pairs" data-testid="board-match-revealed">
                <li v-for="(pair, i) in match.pairs" :key="i" class="match-pair">
                  <span class="match-left">{{ pair.left }}</span>
                  <span class="match-arrow" aria-hidden="true">→</span>
                  <span class="match-right">{{ pair.right }}</span>
                </li>
              </ul>
              <!-- The answers are a pooled, neutrally-ordered bag (not a second
                   column aligned row-for-row), so a viewer can't read the pairing
                   off matching rows before the reveal. -->
              <div v-else class="match-cols" data-testid="board-match-neutral">
                <ul class="match-terms">
                  <li v-for="(pair, i) in match.pairs" :key="i">{{ pair.left }}</li>
                </ul>
                <ul class="match-bag">
                  <li v-for="(right, i) in match.rights" :key="i" class="match-chip">
                    {{ right }}
                  </li>
                </ul>
              </div>
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
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.stage {
  display: contents;
}

/* Cross-fade between the board's states (game ↔ break ↔ draw ↔ ceremony) so the
   big screen never hard-cuts. Reduced-motion users get an instant swap. */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
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

.ranking {
  margin: 0.75rem 0 0;
  padding-left: 1.8rem;
  display: grid;
  gap: clamp(0.4rem, 1.5vw, 0.75rem);
}

.rank-item {
  font-size: clamp(1.15rem, 3.5vw, 1.9rem);
  font-weight: 700;
}

/* The correct order stands out in the accent colour once revealed. */
.ranking.revealed .rank-item {
  color: var(--accent);
}

.ranking.revealed .rank-item::marker {
  color: var(--accent);
  font-weight: 800;
}

.match-cols {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: clamp(0.75rem, 4vw, 2.5rem);
  margin: 0.75rem 0 0;
  align-items: start;
}

.match-terms {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: clamp(0.4rem, 1.5vw, 0.75rem);
  font-size: clamp(1.15rem, 3.5vw, 1.9rem);
  font-weight: 700;
}

/* The answers, pooled as neutrally-ordered chips (not row-aligned to the terms). */
.match-bag {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: clamp(0.4rem, 1.5vw, 0.75rem);
  align-content: start;
}

.match-chip {
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  padding: 0.3rem 0.75rem;
  font-size: clamp(1rem, 3vw, 1.6rem);
  font-weight: 700;
}

.match-pairs {
  list-style: none;
  margin: 0.75rem 0 0;
  padding: 0;
  display: grid;
  gap: clamp(0.4rem, 1.5vw, 0.75rem);
}

.match-pair {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  font-size: clamp(1.15rem, 3.5vw, 1.9rem);
  font-weight: 700;
  color: var(--accent);
}

.match-arrow {
  color: var(--ink-soft);
}
</style>
