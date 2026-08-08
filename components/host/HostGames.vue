<script setup lang="ts">
import type { Game } from '../../core/types'
import { optionLetter } from '../../core/choice'

const { command } = useHost()
const { state, playableGames, teams, teamById, players, quiz, currentQuestion } =
  useTournamentState()

function quizGoto(index: number) {
  command('quizGoto', { index })
}
// Toggles the board reveal for the current game — a quiz answer or an estimate solution.
function reveal(revealed: boolean) {
  command('quizReveal', { revealed })
}

// A game can only be started once teams exist (drawn or created manually).
const hasTeams = computed(() => players.value.length > 0)

const isCurrent = (id: string) => state.value?.currentGameId === id

/** Moves a game up/down within the tournament lineup (the enabled games). */
function move(gameId: string, dir: -1 | 1) {
  const ids = playableGames.value.map((g: Game) => g.id)
  const i = ids.indexOf(gameId)
  const j = i + dir
  if (i < 0 || j < 0 || j >= ids.length) return
  ;[ids[i], ids[j]] = [ids[j] as string, ids[i] as string]
  command('reorderGames', { orderedIds: ids })
}

function setMetric(gameId: string, teamId: string, event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  if (Number.isFinite(value)) command('setMetric', { gameId, teamId, value })
}

function setNote(gameId: string, event: Event) {
  command('updateGame', {
    gameId,
    patch: { hostNote: (event.target as HTMLTextAreaElement).value },
  })
}
</script>

<template>
  <section class="stack" data-testid="host-games">
    <p v-if="!hasTeams" class="muted need-teams" data-testid="need-teams">
      {{ $t('host.needTeams') }}
    </p>

    <!-- Tournament lineup: the enabled games, in order -->
    <ul class="lineup">
      <li
        v-for="(g, i) in playableGames"
        :key="g.id"
        class="card game"
        :class="{ current: isCurrent(g.id) }"
      >
        <div class="game-head">
          <div class="order">
            <button
              class="btn move"
              :disabled="i === 0"
              :aria-label="$t('host.moveUp')"
              data-testid="move-up"
              @click="move(g.id, -1)"
            >
              ↑
            </button>
            <button
              class="btn move"
              :disabled="i === playableGames.length - 1"
              :aria-label="$t('host.moveDown')"
              data-testid="move-down"
              @click="move(g.id, 1)"
            >
              ↓
            </button>
          </div>
          <div class="grow">
            <strong>{{ i + 1 }}. {{ g.title }}</strong>
            <GameTags :game="g" />
            <p v-if="g.materials" class="materials-line muted">📦 {{ g.materials }}</p>
          </div>
          <span v-if="g.winnerTeamId" class="pill win"
            >🏆 {{ teamById(g.winnerTeamId)?.name }}</span
          >
        </div>

        <div v-if="isCurrent(g.id)" class="control stack" data-testid="game-control">
          <p v-if="g.short" class="game-desc">{{ g.short }}</p>
          <p v-if="g.rules" class="game-rules muted">{{ g.rules }}</p>
          <p v-if="g.materials" class="materials-line" data-testid="materials-view">
            📦 {{ g.materials }}
          </p>

          <div
            v-if="g.kind === 'quiz' && g.questions?.length"
            class="quiz-control stack"
            data-testid="quiz-control"
          >
            <div class="muted quiz-progress">
              {{ $t('host.quiz.progress', { n: quiz.index + 1, total: g.questions.length }) }}
            </div>
            <p class="quiz-q">{{ currentQuestion?.question }}</p>
            <p v-if="quiz.revealed" class="quiz-a" data-testid="quiz-answer">
              {{ currentQuestion?.answer }}
            </p>
            <div class="cluster">
              <button
                class="btn"
                :disabled="quiz.index === 0"
                data-testid="quiz-prev"
                @click="quizGoto(quiz.index - 1)"
              >
                ‹ {{ $t('host.quiz.prev') }}
              </button>
              <button
                class="btn"
                :class="{ 'btn-primary': quiz.revealed }"
                :aria-pressed="quiz.revealed"
                data-testid="quiz-reveal"
                @click="reveal(!quiz.revealed)"
              >
                {{ quiz.revealed ? $t('host.quiz.hide') : $t('host.quiz.reveal') }}
              </button>
              <button
                class="btn"
                :disabled="quiz.index >= g.questions.length - 1"
                data-testid="quiz-next"
                @click="quizGoto(quiz.index + 1)"
              >
                {{ $t('host.quiz.next') }} ›
              </button>
            </div>
          </div>

          <div
            v-if="g.kind === 'estimate' && g.estimate"
            class="quiz-control stack"
            data-testid="estimate-control"
          >
            <p class="quiz-q">{{ g.estimate.prompt }}</p>
            <p v-if="quiz.revealed" class="quiz-a" data-testid="estimate-solution">
              {{ g.estimate.solution
              }}<template v-if="g.estimate.unit"> {{ g.estimate.unit }}</template>
            </p>
            <button
              class="btn"
              :class="{ 'btn-primary': quiz.revealed }"
              :aria-pressed="quiz.revealed"
              data-testid="estimate-reveal"
              @click="reveal(!quiz.revealed)"
            >
              {{ quiz.revealed ? $t('host.estimate.hide') : $t('host.estimate.reveal') }}
            </button>
          </div>

          <div
            v-if="g.kind === 'choice' && g.choice"
            class="quiz-control stack"
            data-testid="choice-control"
          >
            <p class="quiz-q">{{ g.choice.prompt }}</p>
            <ul class="choices">
              <li
                v-for="(opt, idx) in g.choice.options"
                :key="idx"
                class="choice"
                :class="{ correct: quiz.revealed && idx === g.choice.correct }"
              >
                <span class="okey" aria-hidden="true">{{ optionLetter(idx) }}</span>
                <span>{{ opt }}</span>
              </li>
            </ul>
            <button
              class="btn"
              :class="{ 'btn-primary': quiz.revealed }"
              :aria-pressed="quiz.revealed"
              data-testid="choice-reveal"
              @click="reveal(!quiz.revealed)"
            >
              {{ quiz.revealed ? $t('host.choice.hide') : $t('host.choice.reveal') }}
            </button>
          </div>

          <div
            v-if="g.kind === 'ranking' && g.ranking"
            class="quiz-control stack"
            data-testid="ranking-control"
          >
            <p class="quiz-q">{{ g.ranking.prompt }}</p>
            <ol class="ranking-list">
              <li v-for="(item, idx) in g.ranking.items" :key="idx">{{ item }}</li>
            </ol>
            <button
              class="btn"
              :class="{ 'btn-primary': quiz.revealed }"
              :aria-pressed="quiz.revealed"
              data-testid="ranking-reveal"
              @click="reveal(!quiz.revealed)"
            >
              {{ quiz.revealed ? $t('host.ranking.hide') : $t('host.ranking.reveal') }}
            </button>
          </div>

          <div class="cluster">
            <button
              v-for="team in teams"
              :key="team.id"
              class="btn btn-primary team-win"
              :class="{ won: g.winnerTeamId === team.id }"
              :style="{ '--team': team.color }"
              data-testid="award-win"
              @click="command('awardWin', { gameId: g.id, teamId: team.id })"
            >
              🏆 {{ $t('host.teamWins', { team: team.name }) }}
            </button>
            <button class="btn" data-testid="undo" @click="command('undoScore', { gameId: g.id })">
              ↩︎ {{ $t('host.undo') }}
            </button>
          </div>

          <div v-if="g.tracksMetric" class="stack metric-block">
            <div class="label">{{ g.metricLabel || $t('host.metric') }}</div>
            <div
              v-for="team in teams"
              :key="team.id"
              class="metric-row"
              :style="{ '--team': team.color }"
            >
              <span class="team-name">{{ team.name }}</span>
              <input
                type="number"
                class="input metric-input"
                :value="g.metricByTeam?.[team.id]"
                @change="setMetric(g.id, team.id, $event)"
              />
              <span class="muted">{{ g.metricUnit }}</span>
            </div>
          </div>

          <div>
            <label class="label" :for="`note-${g.id}`">{{ $t('host.gameNote') }}</label>
            <textarea
              :id="`note-${g.id}`"
              class="textarea note"
              :value="g.hostNote"
              data-testid="game-note"
              @change="setNote(g.id, $event)"
            />
          </div>
        </div>

        <div v-else class="cluster actions">
          <button
            class="btn btn-primary"
            :disabled="!hasTeams"
            :title="hasTeams ? '' : $t('host.needTeams')"
            data-testid="set-current"
            @click="command('setCurrentGame', { gameId: g.id })"
          >
            {{ $t('host.setCurrent') }}
          </button>
        </div>
      </li>

      <li v-if="!playableGames.length" class="muted lineup-empty" data-testid="lineup-empty">
        {{ $t('host.lineupEmpty') }}
      </li>
    </ul>

    <NuxtLink class="btn" to="/host/library" data-testid="open-library">
      📚 {{ $t('host.library') }}
    </NuxtLink>
  </section>
</template>

<style scoped>
.lineup {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.75rem;
}

.game.current {
  border-color: var(--accent);
  border-width: 2px;
}

.game-head {
  display: flex;
  gap: 0.75rem;
  align-items: start;
}

.game-head .grow {
  flex: 1;
}

.order {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.move {
  min-height: 0;
  padding: 0.1rem 0.5rem;
  line-height: 1.2;
}

.win {
  color: var(--accent);
  white-space: nowrap;
}

.control {
  margin: 0.9rem 0 0;
  padding-top: 0.9rem;
  border-top: 1px solid var(--line);
}

.game-desc {
  font-weight: 700;
  margin: 0;
}

.quiz-control {
  gap: 0.4rem;
  border-left: 3px solid var(--accent);
  padding-left: 0.7rem;
}

.quiz-progress {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.quiz-q {
  font-weight: 700;
  font-size: 1.1rem;
  margin: 0;
}

.quiz-a {
  margin: 0;
  color: var(--accent);
  font-weight: 600;
}

.choices {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.3rem;
}

.choice {
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
}

.choice.correct {
  color: var(--accent);
  font-weight: 700;
}

.okey {
  font-weight: 700;
  color: var(--ink-soft);
  min-width: 1.2rem;
}

.choice.correct .okey {
  color: var(--accent);
}

.ranking-list {
  margin: 0;
  padding-left: 1.4rem;
  display: grid;
  gap: 0.2rem;
}

.ranking-list li {
  font-weight: 600;
}

.game-rules {
  margin: 0 0 0.3rem;
}

.materials-line {
  margin: 0.2rem 0 0;
  font-size: 0.9em;
}

.team-win {
  border-left: 6px solid var(--team);
}

.team-win.won {
  outline: 3px solid var(--team);
  outline-offset: 2px;
}

.metric-block {
  border-left: 3px solid var(--line);
  padding-left: 0.7rem;
}

.metric-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-left: 6px solid var(--team);
  padding-left: 0.6rem;
}

.metric-row .team-name {
  font-weight: 700;
  min-width: 6rem;
}

.metric-input {
  width: 7rem;
  min-height: 38px;
}

.note {
  min-height: 3.5rem;
}

.actions {
  margin-top: 0.6rem;
}

.need-teams {
  font-weight: 600;
  margin: 0;
}

.lineup-empty {
  list-style: none;
}
</style>
