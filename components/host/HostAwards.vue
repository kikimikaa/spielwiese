<script setup lang="ts">
import type { Award } from '../../core/types'

const { awards, isAwardRevealed, awardDetailArgs } = useTournamentState()
const { command } = useHost()

const allRevealed = computed<boolean>(
  () => awards.value.length > 0 && awards.value.every((a: Award) => isAwardRevealed(a.id)),
)

function toggle(a: Award) {
  command('revealAward', { awardId: a.id })
}
function revealAll() {
  command('revealAllAwards', { awardIds: awards.value.map((a: Award) => a.id) })
}
function hideAll() {
  command('hideAllAwards')
}
</script>

<template>
  <div class="stack" data-testid="host-awards">
    <p v-if="!awards.length" class="muted">{{ $t('host.awards.empty') }}</p>

    <template v-else>
      <ul class="list">
        <li
          v-for="a in awards"
          :key="a.id"
          class="row card"
          :class="{ revealed: isAwardRevealed(a.id) }"
        >
          <div class="info">
            <span class="label">{{ $t(`awards.${a.id}.label`) }}</span>
            <span v-if="isAwardRevealed(a.id)" class="value">
              {{ $t(`awards.${a.id}.detail`, awardDetailArgs(a)) }}
            </span>
            <span v-else class="value muted">{{ $t('host.awards.hidden') }}</span>
          </div>
          <button
            class="btn toggle"
            :class="{ active: isAwardRevealed(a.id) }"
            :aria-pressed="isAwardRevealed(a.id)"
            :data-testid="`reveal-${a.id}`"
            @click="toggle(a)"
          >
            {{ isAwardRevealed(a.id) ? $t('host.awards.hide') : $t('host.awards.reveal') }}
          </button>
        </li>
      </ul>

      <div class="cluster">
        <button class="btn" :disabled="allRevealed" data-testid="reveal-all" @click="revealAll">
          {{ $t('host.awards.revealAll') }}
        </button>
        <button class="btn" data-testid="hide-all" @click="hideAll">
          {{ $t('host.awards.hideAll') }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.6rem;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
}

.row.revealed {
  border-color: var(--accent);
}

.info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.label {
  font-weight: 700;
}

.value {
  font-size: 0.95rem;
}

.toggle.active {
  border-color: var(--accent);
  border-width: 2px;
  background: var(--surface-2);
}
</style>
