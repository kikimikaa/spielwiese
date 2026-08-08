<script setup lang="ts">
import type { SnapshotMeta } from '../../core/snapshots'

const { locale } = useI18n()
const { snapshots, list, save, load, remove } = useSnapshots()

const name = ref('')
const pendingLoad = ref<SnapshotMeta | null>(null)
const pendingDelete = ref<SnapshotMeta | null>(null)

onMounted(list)

async function doSave() {
  await save(name.value)
  name.value = ''
}

async function doLoad() {
  if (pendingLoad.value) await load(pendingLoad.value.id)
  pendingLoad.value = null
}

async function doDelete() {
  if (pendingDelete.value) await remove(pendingDelete.value.id)
  pendingDelete.value = null
}

const dateFormat = computed(
  () => new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeStyle: 'short' }),
)
</script>

<template>
  <div class="stack" data-testid="host-snapshots">
    <div class="cluster save-row">
      <input
        v-model="name"
        class="input grow"
        :placeholder="$t('host.snapshots.namePlaceholder')"
        data-testid="snapshot-name"
        @keyup.enter="doSave"
      />
      <button class="btn btn-primary" data-testid="snapshot-save" @click="doSave">
        💾 {{ $t('host.snapshots.save') }}
      </button>
    </div>

    <p v-if="!snapshots.length" class="muted" data-testid="snapshots-empty">
      {{ $t('host.snapshots.empty') }}
    </p>

    <ul v-else class="snap-list">
      <li v-for="s in snapshots" :key="s.id" class="snap-row" data-testid="snapshot-row">
        <div class="grow">
          <strong>{{ s.name }}</strong>
          <div class="muted meta">
            {{ dateFormat.format(s.savedAt) }} ·
            {{
              $t('host.snapshots.summary', {
                games: s.summary.games,
                teams: s.summary.teams,
                players: s.summary.players,
              })
            }}
            · {{ $t(`status.${s.summary.status}`) }}
          </div>
        </div>
        <button class="btn" data-testid="snapshot-load" @click="pendingLoad = s">
          ↺ {{ $t('host.snapshots.load') }}
        </button>
        <button class="btn btn-danger" data-testid="snapshot-delete" @click="pendingDelete = s">
          {{ $t('common.delete') }}
        </button>
      </li>
    </ul>

    <AppModal
      :open="pendingLoad !== null"
      :title="$t('host.snapshots.load')"
      :message="$t('host.snapshots.loadConfirm', { name: pendingLoad?.name })"
      :confirm-label="$t('host.snapshots.load')"
      @confirm="doLoad"
      @cancel="pendingLoad = null"
    />

    <AppModal
      :open="pendingDelete !== null"
      danger
      :confirm-label="$t('common.delete')"
      :message="$t('host.snapshots.deleteConfirm', { name: pendingDelete?.name })"
      @confirm="doDelete"
      @cancel="pendingDelete = null"
    />
  </div>
</template>

<style scoped>
.save-row {
  align-items: stretch;
}

.save-row .grow {
  flex: 1;
}

.snap-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.5rem;
}

.snap-row {
  display: flex;
  gap: 0.6rem;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--line);
}

.snap-row .grow {
  flex: 1;
}

.meta {
  font-size: 0.85rem;
  margin-top: 0.15rem;
}
</style>
