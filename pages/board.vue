<script setup lang="ts">
const { t } = useI18n()
useHead({ title: () => `${t('nav.board')} — ${t('app.name')}` })

const { connected } = useTournamentState()
const { enabled: sun, toggle: toggleSun } = useSunMode()
</script>

<template>
  <div class="page board">
    <header class="topbar">
      <div class="cluster">
        <AppBrand />
        <span class="pill pill-dot conn" :class="{ on: connected }" data-testid="board-conn">
          {{ connected ? $t('board.live') : $t('home.offline') }}
        </span>
      </div>
      <div class="cluster">
        <button
          class="btn sun"
          :class="{ active: sun }"
          data-testid="sun-toggle"
          :aria-pressed="sun"
          @click="toggleSun"
        >
          ☀️ {{ $t('board.sunMode') }}
        </button>
        <LangToggle />
      </div>
    </header>

    <BoardStage />
  </div>
</template>

<style scoped>
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.conn {
  color: var(--danger);
}
.conn.on {
  color: var(--accent);
}

.sun.active {
  border-color: var(--accent);
  background: var(--surface-2);
}
</style>
