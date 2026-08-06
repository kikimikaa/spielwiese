<script setup lang="ts">
import type { GameDef } from '../../core/types'

// Keep the library scannable — paginate once it grows past this.
const GAMES_PER_PAGE = 8

defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [boolean] }>()

const { command } = useHost()
const { games } = useTournamentState()

const editing = ref<GameDef | null>(null)
const adding = ref(false)
const pendingDelete = ref<{ kind: 'game' | 'all'; id?: string; title?: string } | null>(null)

const page = ref(0)
const pageCount = computed(() => Math.max(1, Math.ceil(games.value.length / GAMES_PER_PAGE)))
const pagedGames = computed(() =>
  games.value.slice(page.value * GAMES_PER_PAGE, (page.value + 1) * GAMES_PER_PAGE),
)
watch(pageCount, (count: number) => {
  if (page.value > count - 1) page.value = count - 1
})

const isEnabled = (g: GameDef) => g.enabled !== false

function toggleEnabled(g: GameDef) {
  command('updateGame', { gameId: g.id, patch: { enabled: !isEnabled(g) } })
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
        <ul class="lib-list">
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
          <button
            class="btn btn-danger"
            data-testid="clear-games"
            @click="pendingDelete = { kind: 'all' }"
          >
            {{ $t('host.clearGames') }}
          </button>
        </div>

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
