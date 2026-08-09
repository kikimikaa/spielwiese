<script setup lang="ts">
import type {
  ChoiceSpec,
  EstimateSpec,
  GameDef,
  GameLocation,
  MatchPair,
  MatchSpec,
  QuizQuestion,
  RankingSpec,
  ScoringType,
  TrueFalseSpec,
} from '../../core/types'
import { GAME_KINDS } from '../../core/constants'
import { isChoiceComplete, MIN_CHOICE_OPTIONS, optionLetter } from '../../core/choice'
import { isRankingComplete, MIN_RANKING_ITEMS } from '../../core/ranking'
import { isTrueFalseComplete } from '../../core/truefalse'
import { isMatchComplete, MIN_MATCH_PAIRS } from '../../core/match'

const props = defineProps<{ game?: GameDef | null }>()
const emit = defineEmits<{ save: [GameDef]; cancel: [] }>()

const LOCATIONS: GameLocation[] = ['both', 'outdoor', 'indoor']
const SCORING_TYPES: ScoringType[] = [
  'points',
  'versus',
  'stations',
  'measure',
  'betting',
  'pass-fail',
  'final-lives',
]

const form = reactive<GameDef>({
  id: props.game?.id ?? '',
  title: props.game?.title ?? '',
  short: props.game?.short ?? '',
  rules: props.game?.rules ?? '',
  location: props.game?.location ?? 'both',
  scoringType: props.game?.scoringType ?? 'points',
  tracksMetric: props.game?.tracksMetric ?? false,
  metricLabel: props.game?.metricLabel ?? '',
  metricUnit: props.game?.metricUnit ?? '',
  metricLowerIsBetter: props.game?.metricLowerIsBetter ?? false,
  materials: props.game?.materials ?? '',
  hostNote: props.game?.hostNote ?? '',
  kind: props.game?.kind ?? 'freeform',
})

// Separate reactive list so adding/removing rows stays simple; folded back in on save.
const questions = ref<QuizQuestion[]>(props.game?.questions?.map((q) => ({ ...q })) ?? [])

function addQuestion() {
  questions.value.push({ question: '', answer: '' })
}
function removeQuestion(i: number) {
  questions.value.splice(i, 1)
}

// Trimmed, non-empty Q&A pairs — a quiz needs at least one to be saveable.
const cleanQuestions = computed<QuizQuestion[]>(() =>
  questions.value
    .map((q: QuizQuestion) => ({ question: q.question.trim(), answer: q.answer.trim() }))
    .filter((q: QuizQuestion) => q.question && q.answer),
)

const estimate = reactive<EstimateSpec>({
  prompt: props.game?.estimate?.prompt ?? '',
  solution: props.game?.estimate?.solution ?? '',
  unit: props.game?.estimate?.unit ?? '',
})

// Trimmed estimate — needs a prompt and a solution to be saveable.
const cleanEstimate = computed<EstimateSpec>(() => {
  const spec: EstimateSpec = { prompt: estimate.prompt.trim(), solution: estimate.solution.trim() }
  const unit = estimate.unit?.trim()
  if (unit) spec.unit = unit
  return spec
})

// Multiple choice: a prompt, its options, and which one is correct. A new choice
// starts with the minimum number of empty option rows.
const choicePrompt = ref(props.game?.choice?.prompt ?? '')
const choiceOptions = ref<string[]>(
  props.game?.choice?.options.slice() ?? Array.from({ length: MIN_CHOICE_OPTIONS }, () => ''),
)
const choiceCorrect = ref(props.game?.choice?.correct ?? 0)

function addOption() {
  choiceOptions.value.push('')
}
function removeOption(i: number) {
  choiceOptions.value.splice(i, 1)
  // Keep the correct pointer on the same option after a row is removed.
  if (choiceCorrect.value === i) choiceCorrect.value = 0
  else if (choiceCorrect.value > i) choiceCorrect.value -= 1
}

// Trimmed choice with empty options dropped; `correct` re-mapped to survive the drop.
const cleanChoice = computed<ChoiceSpec>(() => {
  const options: string[] = []
  let correct = 0
  choiceOptions.value.forEach((option: string, i: number) => {
    const text = option.trim()
    if (!text) return
    if (i === choiceCorrect.value) correct = options.length
    options.push(text)
  })
  return { prompt: choicePrompt.value.trim(), options, correct }
})

// Ordering: a prompt and the items in their correct order. Rows start empty.
const rankingPrompt = ref(props.game?.ranking?.prompt ?? '')
const rankingItems = ref<string[]>(
  props.game?.ranking?.items.slice() ?? Array.from({ length: MIN_RANKING_ITEMS }, () => ''),
)

function addItem() {
  rankingItems.value.push('')
}
function removeItem(i: number) {
  rankingItems.value.splice(i, 1)
}

// Trimmed ranking with empty rows dropped; the surviving order is the answer.
const cleanRanking = computed<RankingSpec>(() => ({
  prompt: rankingPrompt.value.trim(),
  items: rankingItems.value.map((item: string) => item.trim()).filter((item: string) => item),
}))

// True/false: a statement and which answer is correct.
const trueFalse = reactive<TrueFalseSpec>({
  statement: props.game?.truefalse?.statement ?? '',
  answer: props.game?.truefalse?.answer ?? true,
})

const cleanTrueFalse = computed<TrueFalseSpec>(() => ({
  statement: trueFalse.statement.trim(),
  answer: trueFalse.answer,
}))

// Matching: a prompt and left/right pairs. Rows start empty.
const matchPrompt = ref(props.game?.match?.prompt ?? '')
const matchPairs = ref<MatchPair[]>(
  props.game?.match?.pairs.map((p) => ({ ...p })) ??
    Array.from({ length: MIN_MATCH_PAIRS }, () => ({ left: '', right: '' })),
)

function addPair() {
  matchPairs.value.push({ left: '', right: '' })
}
function removePair(i: number) {
  matchPairs.value.splice(i, 1)
}

// Trimmed pairs with incomplete rows dropped; the surviving order is the answer.
const cleanMatch = computed<MatchSpec>(() => ({
  prompt: matchPrompt.value.trim(),
  pairs: matchPairs.value
    .map((p: MatchPair) => ({ left: p.left.trim(), right: p.right.trim() }))
    .filter((p: MatchPair) => p.left && p.right),
}))

const canSave = computed(() => {
  if (form.title.trim().length === 0) return false
  if (form.kind === 'quiz') return cleanQuestions.value.length > 0
  if (form.kind === 'estimate')
    return Boolean(cleanEstimate.value.prompt && cleanEstimate.value.solution)
  if (form.kind === 'choice') return isChoiceComplete(cleanChoice.value)
  if (form.kind === 'ranking') return isRankingComplete(cleanRanking.value)
  if (form.kind === 'truefalse') return isTrueFalseComplete(cleanTrueFalse.value)
  if (form.kind === 'match') return isMatchComplete(cleanMatch.value)
  return true
})

function submit() {
  if (!canSave.value) return
  const game: GameDef = { ...form, title: form.title.trim() }
  // Only the matching type carries its content; the store clears it on a type change.
  if (form.kind === 'quiz') game.questions = cleanQuestions.value
  if (form.kind === 'estimate') game.estimate = cleanEstimate.value
  if (form.kind === 'choice') game.choice = cleanChoice.value
  if (form.kind === 'ranking') game.ranking = cleanRanking.value
  if (form.kind === 'truefalse') game.truefalse = cleanTrueFalse.value
  if (form.kind === 'match') game.match = cleanMatch.value
  emit('save', game)
}
</script>

<template>
  <form class="stack" data-testid="game-form" @submit.prevent="submit">
    <div>
      <label class="label" for="g-title">{{ $t('host.gameForm.title') }}</label>
      <input id="g-title" v-model="form.title" class="input" data-testid="game-title" required />
    </div>

    <div>
      <label class="label" for="g-short">
        {{ $t('host.gameForm.short') }} <span class="opt">({{ $t('common.optional') }})</span>
      </label>
      <input id="g-short" v-model="form.short" class="input" />
    </div>

    <div>
      <label class="label" for="g-kind">{{ $t('host.gameForm.kind') }}</label>
      <select id="g-kind" v-model="form.kind" class="select" data-testid="game-kind">
        <option v-for="k in GAME_KINDS" :key="k" :value="k">
          {{ $t(`host.gameForm.kindOption.${k}`) }}
        </option>
      </select>
    </div>

    <div v-if="form.kind === 'quiz'" class="stack quiz-editor" data-testid="quiz-editor">
      <span class="label">{{ $t('host.gameForm.questions') }}</span>
      <div v-for="(q, i) in questions" :key="i" class="qrow">
        <input
          v-model="q.question"
          class="input"
          :placeholder="$t('host.gameForm.question')"
          :data-testid="`quiz-question-${i}`"
        />
        <input
          v-model="q.answer"
          class="input"
          :placeholder="$t('host.gameForm.answer')"
          :data-testid="`quiz-answer-${i}`"
        />
        <button
          type="button"
          class="btn btn-danger qdel"
          :aria-label="$t('host.gameForm.removeQuestion')"
          data-testid="quiz-remove"
          @click="removeQuestion(i)"
        >
          ✕
        </button>
      </div>
      <button type="button" class="btn" data-testid="quiz-add" @click="addQuestion">
        ＋ {{ $t('host.gameForm.addQuestion') }}
      </button>
    </div>

    <div v-if="form.kind === 'estimate'" class="stack quiz-editor" data-testid="estimate-editor">
      <div>
        <label class="label" for="g-est-prompt">{{ $t('host.gameForm.estimatePrompt') }}</label>
        <input
          id="g-est-prompt"
          v-model="estimate.prompt"
          class="input"
          data-testid="estimate-prompt"
        />
      </div>
      <div class="grid2">
        <div>
          <label class="label" for="g-est-solution">
            {{ $t('host.gameForm.estimateSolution') }}
          </label>
          <input
            id="g-est-solution"
            v-model="estimate.solution"
            class="input"
            data-testid="estimate-solution-input"
          />
        </div>
        <div>
          <label class="label" for="g-est-unit">
            {{ $t('host.gameForm.metricUnit') }}
            <span class="opt">({{ $t('common.optional') }})</span>
          </label>
          <input
            id="g-est-unit"
            v-model="estimate.unit"
            class="input"
            :placeholder="$t('host.gameForm.estimateUnitPlaceholder')"
            data-testid="estimate-unit"
          />
        </div>
      </div>
    </div>

    <div v-if="form.kind === 'choice'" class="stack quiz-editor" data-testid="choice-editor">
      <div>
        <label class="label" for="g-choice-prompt">{{ $t('host.gameForm.choicePrompt') }}</label>
        <input
          id="g-choice-prompt"
          v-model="choicePrompt"
          class="input"
          data-testid="choice-prompt"
        />
      </div>
      <span class="label">{{ $t('host.gameForm.choiceOptions') }}</span>
      <div v-for="(_, i) in choiceOptions" :key="i" class="orow">
        <input
          v-model="choiceCorrect"
          type="radio"
          :value="i"
          :aria-label="$t('host.gameForm.markCorrect')"
          :data-testid="`choice-correct-${i}`"
        />
        <span class="okey" aria-hidden="true">{{ optionLetter(i) }}</span>
        <input
          v-model="choiceOptions[i]"
          class="input"
          :placeholder="$t('host.gameForm.choiceOption')"
          :data-testid="`choice-option-${i}`"
        />
        <button
          type="button"
          class="btn btn-danger qdel"
          :disabled="choiceOptions.length <= MIN_CHOICE_OPTIONS"
          :aria-label="$t('host.gameForm.removeOption')"
          data-testid="choice-remove"
          @click="removeOption(i)"
        >
          ✕
        </button>
      </div>
      <button type="button" class="btn" data-testid="choice-add" @click="addOption">
        ＋ {{ $t('host.gameForm.addOption') }}
      </button>
    </div>

    <div v-if="form.kind === 'ranking'" class="stack quiz-editor" data-testid="ranking-editor">
      <div>
        <label class="label" for="g-rank-prompt">{{ $t('host.gameForm.rankingPrompt') }}</label>
        <input
          id="g-rank-prompt"
          v-model="rankingPrompt"
          class="input"
          data-testid="ranking-prompt"
        />
      </div>
      <span class="label">{{ $t('host.gameForm.rankingItems') }}</span>
      <p class="muted hint">{{ $t('host.gameForm.rankingHint') }}</p>
      <div v-for="(_, i) in rankingItems" :key="i" class="orow">
        <span class="okey" aria-hidden="true">{{ i + 1 }}</span>
        <input
          v-model="rankingItems[i]"
          class="input"
          :placeholder="$t('host.gameForm.rankingItem')"
          :data-testid="`ranking-item-${i}`"
        />
        <button
          type="button"
          class="btn btn-danger qdel"
          :disabled="rankingItems.length <= MIN_RANKING_ITEMS"
          :aria-label="$t('host.gameForm.removeItem')"
          data-testid="ranking-remove"
          @click="removeItem(i)"
        >
          ✕
        </button>
      </div>
      <button type="button" class="btn" data-testid="ranking-add" @click="addItem">
        ＋ {{ $t('host.gameForm.addItem') }}
      </button>
    </div>

    <div v-if="form.kind === 'truefalse'" class="stack quiz-editor" data-testid="truefalse-editor">
      <div>
        <label class="label" for="g-tf-statement">
          {{ $t('host.gameForm.trueFalseStatement') }}
        </label>
        <input
          id="g-tf-statement"
          v-model="trueFalse.statement"
          class="input"
          data-testid="truefalse-statement"
        />
      </div>
      <span class="label">{{ $t('host.gameForm.trueFalseAnswer') }}</span>
      <div class="cluster">
        <label class="check">
          <input
            v-model="trueFalse.answer"
            type="radio"
            :value="true"
            data-testid="truefalse-true"
          />
          {{ $t('truefalse.true') }}
        </label>
        <label class="check">
          <input
            v-model="trueFalse.answer"
            type="radio"
            :value="false"
            data-testid="truefalse-false"
          />
          {{ $t('truefalse.false') }}
        </label>
      </div>
    </div>

    <div v-if="form.kind === 'match'" class="stack quiz-editor" data-testid="match-editor">
      <div>
        <label class="label" for="g-match-prompt">{{ $t('host.gameForm.matchPrompt') }}</label>
        <input id="g-match-prompt" v-model="matchPrompt" class="input" data-testid="match-prompt" />
      </div>
      <span class="label">{{ $t('host.gameForm.matchPairs') }}</span>
      <p class="muted hint">{{ $t('host.gameForm.matchHint') }}</p>
      <div v-for="(_, i) in matchPairs" :key="i" class="prow">
        <input
          v-model="matchPairs[i].left"
          class="input"
          :placeholder="$t('host.gameForm.matchLeft')"
          :data-testid="`match-left-${i}`"
        />
        <span class="parrow" aria-hidden="true">↔</span>
        <input
          v-model="matchPairs[i].right"
          class="input"
          :placeholder="$t('host.gameForm.matchRight')"
          :data-testid="`match-right-${i}`"
        />
        <button
          type="button"
          class="btn btn-danger qdel"
          :disabled="matchPairs.length <= MIN_MATCH_PAIRS"
          :aria-label="$t('host.gameForm.removeItem')"
          data-testid="match-remove"
          @click="removePair(i)"
        >
          ✕
        </button>
      </div>
      <button type="button" class="btn" data-testid="match-add" @click="addPair">
        ＋ {{ $t('host.gameForm.addItem') }}
      </button>
    </div>

    <div>
      <label class="label" for="g-rules">
        {{ $t('host.gameForm.rules') }} <span class="opt">({{ $t('common.optional') }})</span>
      </label>
      <textarea id="g-rules" v-model="form.rules" class="textarea" />
    </div>

    <div class="grid2">
      <div>
        <label class="label" for="g-loc">{{ $t('host.gameForm.location') }}</label>
        <select id="g-loc" v-model="form.location" class="select">
          <option v-for="l in LOCATIONS" :key="l" :value="l">{{ $t(`location.${l}`) }}</option>
        </select>
      </div>
      <div>
        <label class="label" for="g-score">{{ $t('host.gameForm.scoringType') }}</label>
        <select id="g-score" v-model="form.scoringType" class="select">
          <option v-for="s in SCORING_TYPES" :key="s" :value="s">{{ $t(`scoring.${s}`) }}</option>
        </select>
        <p class="muted hint">{{ $t(`scoringDesc.${form.scoringType}`) }}</p>
      </div>
    </div>

    <label class="check">
      <input v-model="form.tracksMetric" type="checkbox" />
      {{ $t('host.gameForm.tracksMetric') }}
    </label>

    <div v-if="form.tracksMetric" class="grid3">
      <div>
        <label class="label" for="g-mlabel">
          {{ $t('host.gameForm.metricLabel') }}
          <span class="opt">({{ $t('common.optional') }})</span>
        </label>
        <input id="g-mlabel" v-model="form.metricLabel" class="input" />
      </div>
      <div>
        <label class="label" for="g-munit">
          {{ $t('host.gameForm.metricUnit') }}
          <span class="opt">({{ $t('common.optional') }})</span>
        </label>
        <input id="g-munit" v-model="form.metricUnit" class="input" />
      </div>
      <label class="check">
        <input v-model="form.metricLowerIsBetter" type="checkbox" />
        {{ $t('host.gameForm.metricLowerIsBetter') }}
      </label>
    </div>

    <div>
      <label class="label" for="g-materials">
        {{ $t('host.gameForm.materials') }} <span class="opt">({{ $t('common.optional') }})</span>
      </label>
      <input
        id="g-materials"
        v-model="form.materials"
        class="input"
        :placeholder="$t('host.gameForm.materialsPlaceholder')"
        data-testid="game-materials"
      />
    </div>

    <div>
      <label class="label" for="g-note">
        {{ $t('host.gameForm.notes') }} <span class="opt">({{ $t('common.optional') }})</span>
      </label>
      <textarea
        id="g-note"
        v-model="form.hostNote"
        class="textarea"
        :placeholder="$t('host.gameForm.notesPlaceholder')"
        data-testid="game-note-field"
      />
    </div>

    <div class="cluster">
      <button type="submit" class="btn btn-primary" :disabled="!canSave" data-testid="game-save">
        {{ $t('common.save') }}
      </button>
      <button type="button" class="btn" @click="emit('cancel')">{{ $t('common.cancel') }}</button>
    </div>
  </form>
</template>

<style scoped>
.grid2 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
  gap: 0.75rem;
}

.grid3 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 10rem), 1fr));
  gap: 0.75rem;
  align-items: end;
}

.check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}

.hint {
  font-size: 0.85rem;
  margin: 0.35rem 0 0;
}

.opt {
  font-weight: 400;
  color: var(--ink-soft);
  font-size: 0.85em;
}

.quiz-editor {
  gap: 0.5rem;
  border-left: 3px solid var(--line);
  padding-left: 0.7rem;
}

.qrow {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.qrow .input {
  flex: 1;
}

.orow {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.orow .input {
  flex: 1;
}

.okey {
  font-weight: 700;
  color: var(--ink-soft);
  min-width: 1.2rem;
  text-align: center;
}

.prow {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.prow .input {
  flex: 1;
  min-width: 6rem;
}

.parrow {
  color: var(--ink-soft);
  font-weight: 700;
}

.qdel {
  min-height: 40px;
  padding: 0.4rem 0.7rem;
  flex: none;
}
</style>
