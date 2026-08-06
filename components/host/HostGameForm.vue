<script setup lang="ts">
import type { GameDef, GameLocation, ScoringType } from '../../core/types'

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
})

const canSave = computed(() => form.title.trim().length > 0)

function submit() {
  if (!canSave.value) return
  emit('save', { ...form, title: form.title.trim() })
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
</style>
