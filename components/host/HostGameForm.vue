<script setup lang="ts">
import type { GameDef, GameLocation, QuizQuestion, ScoringType } from '../../core/types'
import { GAME_KINDS } from '../../core/constants'

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

const canSave = computed(() => {
  if (form.title.trim().length === 0) return false
  if (form.kind === 'quiz') return cleanQuestions.value.length > 0
  return true
})

function submit() {
  if (!canSave.value) return
  const game: GameDef = { ...form, title: form.title.trim() }
  // Only a quiz carries questions; the store clears them when kind changes away.
  if (form.kind === 'quiz') game.questions = cleanQuestions.value
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

.qdel {
  min-height: 0;
  padding: 0.4rem 0.6rem;
  flex: none;
}
</style>
