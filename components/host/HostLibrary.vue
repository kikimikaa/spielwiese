<script setup lang="ts">
import type { GameDef } from '../../core/types'
import { GAME_KINDS, GAME_LOCATIONS } from '../../core/constants'
import { activeFacetCount, emptyGameFilter, filterGames, isFilterActive } from '../../core/library'
import type { GameFilter } from '../../core/library'
import { PRESET_PACKS, PRESET_PACK_IDS, presetLocaleOf } from '../../core/presets'

// Keep the library scannable — paginate once it grows past this.
const GAMES_PER_PAGE = 8

const { t, locale } = useI18n()
const { command } = useHost()

function loadPreset(packId: string) {
  command('loadPreset', { packId, locale: presetLocaleOf(locale.value) })
}
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

const filter = ref<GameFilter>(emptyGameFilter())
const filtersOpen = ref(false)
const filteredGames = computed(() => filterGames(games.value, filter.value))
const filterActive = computed(() => isFilterActive(filter.value))
const facetCount = computed(() => activeFacetCount(filter.value))

function toggleValue<T>(list: T[], value: T) {
  const at = list.indexOf(value)
  if (at === -1) list.push(value)
  else list.splice(at, 1)
}

function clearFilter() {
  filter.value = emptyGameFilter()
}

const libraryEl = ref<HTMLElement | null>(null)
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

/** Flips the page and scrolls back to the top, so the new page reads from the start. */
function goToPage(next: number) {
  page.value = Math.min(pageCount.value - 1, Math.max(0, next))
  nextTick(() => libraryEl.value?.scrollIntoView({ block: 'start' }))
}
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
  <div ref="libraryEl" class="stack" data-testid="library">
    <div class="lib-header">
      <h1>{{ $t('host.library') }}</h1>
      <button class="btn btn-primary add-game" data-testid="add-game" @click="adding = true">
        ＋ {{ $t('host.addGame') }}
      </button>
    </div>

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
      <div class="search-line">
        <input
          v-model="filter.query"
          type="search"
          class="input grow"
          :placeholder="$t('host.searchPlaceholder')"
          :aria-label="$t('host.searchPlaceholder')"
          data-testid="library-search"
        />
        <button
          class="btn filter-toggle"
          :class="{ active: facetCount > 0 }"
          :aria-expanded="filtersOpen"
          aria-controls="library-filters"
          :aria-label="$t('host.filterLabel')"
          :title="$t('host.filterLabel')"
          data-testid="filter-toggle"
          @click="filtersOpen = !filtersOpen"
        >
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
            <path d="M1 2h14l-5.5 7v5l-3-1.5V9L1 2z" fill="currentColor" />
          </svg>
          <span v-if="facetCount" class="facet-badge" data-testid="filter-count">
            {{ facetCount }}
          </span>
          <span class="chevron" :class="{ open: filtersOpen }" aria-hidden="true">▾</span>
        </button>
      </div>

      <div
        v-show="filtersOpen"
        id="library-filters"
        class="filter-panel"
        data-testid="filter-panel"
      >
        <fieldset class="facet">
          <legend>{{ $t('host.filterByType') }}</legend>
          <label v-for="k in GAME_KINDS" :key="k" class="facet-option">
            <input
              type="checkbox"
              :checked="filter.kinds.includes(k)"
              :data-testid="`filter-kind-${k}`"
              @change="toggleValue(filter.kinds, k)"
            />
            <span>{{ $t(`host.gameForm.kindOption.${k}`) }}</span>
          </label>
        </fieldset>
        <fieldset class="facet">
          <legend>{{ $t('host.filterByLocation') }}</legend>
          <label v-for="loc in GAME_LOCATIONS" :key="loc" class="facet-option">
            <input
              type="checkbox"
              :checked="filter.locations.includes(loc)"
              :data-testid="`filter-location-${loc}`"
              @change="toggleValue(filter.locations, loc)"
            />
            <span>{{ $t(`location.${loc}`) }}</span>
          </label>
        </fieldset>
        <fieldset class="facet">
          <legend>{{ $t('host.filterByPack') }}</legend>
          <label v-for="packId in PRESET_PACK_IDS" :key="packId" class="facet-option">
            <input
              type="checkbox"
              :checked="filter.packs.includes(packId)"
              :data-testid="`filter-pack-${packId}`"
              @change="toggleValue(filter.packs, packId)"
            />
            <span>{{ $t(`host.presets.pack.${packId}`) }}</span>
          </label>
        </fieldset>
        <button
          class="btn clear-filter"
          :disabled="!filterActive"
          data-testid="filter-clear"
          @click="clearFilter"
        >
          {{ $t('host.clearFilter') }}
        </button>
      </div>
    </div>

    <p
      v-if="filterActive && filteredGames.length"
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
        @click="goToPage(page - 1)"
      >
        ‹
      </button>
      <span class="muted">{{ $t('host.pageOf', { page: page + 1, total: pageCount }) }}</span>
      <button
        class="btn"
        :disabled="page >= pageCount - 1"
        data-testid="page-next"
        @click="goToPage(page + 1)"
      >
        ›
      </button>
    </div>

    <div class="presets stack" data-testid="presets">
      <span class="label">{{ $t('host.presets.label') }}</span>
      <p class="muted hint">{{ $t('host.presets.hint') }}</p>
      <div class="cluster preset-packs">
        <button
          v-for="pack in PRESET_PACKS"
          :key="pack.id"
          class="btn"
          :data-testid="`preset-${pack.id}`"
          @click="loadPreset(pack.id)"
        >
          ＋ {{ $t(`host.presets.pack.${pack.id}`) }}
        </button>
      </div>
    </div>

    <div class="cluster lib-actions">
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
.lib-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.lib-header h1 {
  margin: 0;
}

.select-row {
  align-items: center;
}

.select-row .grow {
  flex: 1;
}

.filter-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.search-line {
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
}

.search-line .grow {
  flex: 1;
}

.filter-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  flex: 0 0 auto;
}

.filter-toggle.active {
  border-color: var(--accent);
  color: var(--accent);
}

.facet-badge {
  min-width: 1.25rem;
  padding: 0 0.35rem;
  border-radius: 999px;
  background: var(--accent);
  color: var(--surface);
  font-size: 0.75rem;
  font-weight: 700;
  text-align: center;
}

.chevron {
  transition: transform 0.15s ease;
}

.chevron.open {
  transform: rotate(180deg);
}

@media (prefers-reduced-motion: reduce) {
  .chevron {
    transition: none;
  }
}

.filter-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  align-items: flex-start;
  padding: 0.75rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface-2);
}

.facet {
  border: 0;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.facet legend {
  padding: 0;
  margin-bottom: 0.15rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.facet-option {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  cursor: pointer;
}

.facet-option input {
  width: 1.1rem;
  height: 1.1rem;
}

.clear-filter {
  margin-left: auto;
  align-self: center;
}

.result-hint {
  margin: 0;
  font-size: 0.85rem;
}

.add-game {
  flex: 0 0 auto;
}

.presets {
  gap: 0.4rem;
  padding: 0.75rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface-2);
}

.presets .hint {
  margin: 0;
  font-size: 0.85rem;
}

.preset-packs > .btn {
  flex: 1 1 auto;
}

/* Spread the maintenance actions evenly across the row instead of clumping left. */
.lib-actions > .btn {
  flex: 1 1 auto;
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
</style>
