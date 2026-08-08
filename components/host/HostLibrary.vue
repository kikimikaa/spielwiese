<script setup lang="ts">
import type { GameDef } from '../../core/types'
import { GAME_KINDS, GAME_LOCATIONS } from '../../core/constants'
import { EMPTY_GAME_FILTER, filterGames, isFilterActive } from '../../core/library'
import type { GameFilter } from '../../core/library'

// Keep the library scannable — paginate once it grows past this.
const GAMES_PER_PAGE = 8

defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [boolean] }>()

const { t } = useI18n()
const { command } = useHost()
const { games } = useTournamentState()
const { exportConfig, importFromFile, importError } = useConfigTransfer()

const fileInput = ref<HTMLInputElement | null>(null)

function pickFile() {
  importError.value = null
  fileInput.value?.click()
}

async function onFileChosen(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) await importFromFile(file)
  input.value = '' // reset so choosing the same file again re-triggers change
}

const importErrorMsg = computed(() => {
  const e = importError.value
  if (!e) return null
  if (e === 'unsupported-version') return t('host.importErrorVersion')
  if (e === 'failed') return t('host.importFailed')
  return t('host.importError')
})

const editing = ref<GameDef | null>(null)
const adding = ref(false)
const pendingDelete = ref<{ kind: 'game' | 'all'; id?: string; title?: string } | null>(null)

const filter = ref<GameFilter>({ ...EMPTY_GAME_FILTER })
const filteredGames = computed(() => filterGames(games.value, filter.value))
const filterActive = computed(() => isFilterActive(filter.value))
function clearFilter() {
  filter.value = { ...EMPTY_GAME_FILTER }
}

const page = ref(0)
const pageCount = computed(() =>
  Math.max(1, Math.ceil(filteredGames.value.length / GAMES_PER_PAGE)),
)
const pagedGames = computed(() =>
  filteredGames.value.slice(page.value * GAMES_PER_PAGE, (page.value + 1) * GAMES_PER_PAGE),
)
watch(pageCount, (count: number) => {
  if (page.value > count - 1) page.value = count - 1
})
// A narrower filter can leave you on a now-nonexistent page — jump back to the first.
watch(filter, () => (page.value = 0), { deep: true })

const isEnabled = (g: GameDef) => g.enabled !== false
const enabledCount = computed(() => games.value.filter(isEnabled).length)

function toggleEnabled(g: GameDef) {
  command('updateGame', { gameId: g.id, patch: { enabled: !isEnabled(g) } })
}

/** Ticks or unticks every game at once — spares the host clicking each one. */
function setAll(enabled: boolean) {
  command('setAllEnabled', { enabled })
}

function closeForm() {
  adding.value = false
  editing.value = null
}

async function save(game: GameDef) {
  if (game.id) await command('updateGame', { gameId: game.id, patch: game })
  else await command('addGame', { game })
  closeForm()
}

async function confirmDelete() {
  const p = pendingDelete.value
  if (p?.kind === 'game' && p.id) await command('removeGame', { gameId: p.id })
  else if (p?.kind === 'all') await command('clearGames')
  pendingDelete.value = null
}
</script>

<template>
  <div>
    <AppModal
      :open="open"
      wide
      hide-actions
      :title="$t('host.library')"
      @cancel="emit('update:open', false)"
    >
      <div class="stack" data-testid="library">
        <div v-if="games.length" class="cluster select-row" data-testid="select-all-row">
          <span class="muted grow">
            {{ $t('host.selectedCount', { n: enabledCount, total: games.length }) }}
          </span>
          <button
            class="btn"
            :disabled="enabledCount === games.length"
            data-testid="select-all"
            @click="setAll(true)"
          >
            {{ $t('host.selectAll') }}
          </button>
          <button
            class="btn"
            :disabled="enabledCount === 0"
            data-testid="select-none"
            @click="setAll(false)"
          >
            {{ $t('host.selectNone') }}
          </button>
        </div>

        <div v-if="games.length" class="filter-row" data-testid="library-filter">
          <input
            v-model="filter.query"
            type="search"
            class="input grow"
            :placeholder="$t('host.searchPlaceholder')"
            :aria-label="$t('host.searchPlaceholder')"
            data-testid="library-search"
          />
          <select
            v-model="filter.kind"
            class="input"
            :aria-label="$t('host.gameForm.kind')"
            data-testid="filter-kind"
          >
            <option value="all">{{ $t('host.filterAll') }}</option>
            <option v-for="k in GAME_KINDS" :key="k" :value="k">
              {{ $t(`host.gameForm.kindOption.${k}`) }}
            </option>
          </select>
          <select
            v-model="filter.location"
            class="input"
            :aria-label="$t('host.gameForm.location')"
            data-testid="filter-location"
          >
            <option value="all">{{ $t('host.filterAll') }}</option>
            <option v-for="loc in GAME_LOCATIONS" :key="loc" :value="loc">
              {{ $t(`location.${loc}`) }}
            </option>
          </select>
          <button v-if="filterActive" class="btn" data-testid="filter-clear" @click="clearFilter">
            {{ $t('host.clearFilter') }}
          </button>
        </div>

        <p
          v-if="filterActive && games.length"
          class="muted result-hint"
          data-testid="filter-results"
        >
          {{ $t('host.filterResults', { n: filteredGames.length, total: games.length }) }}
        </p>

        <p
          v-if="games.length && !filteredGames.length"
          class="muted no-matches"
          data-testid="no-matches"
        >
          {{ $t('host.noMatches') }}
        </p>

        <ul v-else class="lib-list">
          <li v-for="g in pagedGames" :key="g.id" class="lib-row" :class="{ off: !isEnabled(g) }">
            <label class="incl">
              <input
                type="checkbox"
                :checked="isEnabled(g)"
                data-testid="game-enabled"
                @change="toggleEnabled(g)"
              />
              <span class="muted">{{ $t('host.included') }}</span>
            </label>
            <div class="grow">
              <strong>{{ g.title }}</strong>
              <GameTags :game="g" />
              <p v-if="g.materials" class="materials-line muted">📦 {{ g.materials }}</p>
            </div>
            <button class="btn" data-testid="edit-game" @click="editing = g">
              {{ $t('common.edit') }}
            </button>
            <button
              class="btn btn-danger"
              data-testid="delete-game"
              @click="pendingDelete = { kind: 'game', id: g.id, title: g.title }"
            >
              {{ $t('common.delete') }}
            </button>
          </li>
        </ul>

        <div v-if="pageCount > 1" class="pager" data-testid="games-pager">
          <button
            class="btn"
            :disabled="page === 0"
            data-testid="page-prev"
            @click="page = Math.max(0, page - 1)"
          >
            ‹
          </button>
          <span class="muted">{{ $t('host.pageOf', { page: page + 1, total: pageCount }) }}</span>
          <button
            class="btn"
            :disabled="page >= pageCount - 1"
            data-testid="page-next"
            @click="page = Math.min(pageCount - 1, page + 1)"
          >
            ›
          </button>
        </div>

        <div class="cluster">
          <button
            class="btn btn-primary"
            :aria-label="$t('host.addGame')"
            :title="$t('host.addGame')"
            data-testid="add-game"
            @click="adding = true"
          >
            ＋
          </button>
          <button class="btn" data-testid="load-examples" @click="command('loadExampleGames')">
            {{ $t('host.loadExamples') }}
          </button>
          <button class="btn" data-testid="export-config" @click="exportConfig">
            ⬇ {{ $t('host.exportConfig') }}
          </button>
          <button class="btn" data-testid="import-config" @click="pickFile">
            ⬆ {{ $t('host.importConfig') }}
          </button>
          <button
            class="btn btn-danger"
            data-testid="clear-games"
            @click="pendingDelete = { kind: 'all' }"
          >
            {{ $t('host.clearGames') }}
          </button>
          <input
            ref="fileInput"
            type="file"
            accept="application/json,.json"
            class="visually-hidden"
            data-testid="import-file"
            @change="onFileChosen"
          />
        </div>

        <p v-if="importErrorMsg" class="err" data-testid="import-error">{{ importErrorMsg }}</p>

        <div class="save-row">
          <button
            class="btn btn-primary"
            data-testid="library-save"
            @click="emit('update:open', false)"
          >
            {{ $t('host.saveSelection') }}
          </button>
        </div>
      </div>
    </AppModal>

    <AppModal
      :open="adding || Boolean(editing)"
      wide
      hide-actions
      :title="editing ? $t('host.editGame') : $t('host.addGame')"
      @cancel="closeForm"
    >
      <HostGameForm :game="editing" @save="save" @cancel="closeForm" />
    </AppModal>

    <AppModal
      :open="pendingDelete !== null"
      danger
      :confirm-label="$t('common.delete')"
      :message="
        pendingDelete?.kind === 'all'
          ? $t('host.clearGamesConfirm')
          : $t('host.deleteGameConfirm', { title: pendingDelete?.title })
      "
      @confirm="confirmDelete"
      @cancel="pendingDelete = null"
    />
  </div>
</template>

<style scoped>
.select-row {
  align-items: center;
}

.select-row .grow {
  flex: 1;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.filter-row .grow {
  flex: 1 1 12rem;
}

/* Selects size to their content instead of the global full-width input. */
.filter-row select.input {
  width: auto;
  flex: 0 0 auto;
}

.result-hint {
  margin: 0;
  font-size: 0.85rem;
}

.no-matches {
  text-align: center;
  padding: 1.25rem 0;
}

.lib-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.5rem;
}

.lib-row {
  display: flex;
  gap: 0.6rem;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--line);
}

.lib-row.off {
  opacity: 0.55;
}

.lib-row .grow {
  flex: 1;
}

.materials-line {
  margin: 0.2rem 0 0;
  font-size: 0.9em;
}

.incl {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
}

.incl input {
  width: 1.25rem;
  height: 1.25rem;
}

.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  font-weight: 700;
}

.save-row {
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid var(--line);
  padding-top: 0.75rem;
}
</style>
