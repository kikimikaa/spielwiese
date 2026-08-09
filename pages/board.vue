<script setup lang="ts">
const { t } = useI18n()
useHead({ title: () => `${t('nav.board')} — ${t('app.name')}` })

const { state, connected } = useTournamentState()
const { enabled: sun, toggle: toggleSun } = useSunMode()
const { enabled: sound, toggle: toggleSound, playWin, playFanfare } = useSound()

// The board is where the atmosphere lives: a chime on each win, a fanfare when
// the ceremony ends. Both no-op unless the host has switched sound on.
useGameWins(() => playWin())
watch(
  () => state.value?.status,
  (status: string | undefined, prev: string | undefined) => {
    if (status === 'finished' && prev && prev !== 'finished') playFanfare()
  },
)
</script>

<template>
  <div class="page board">
    <header class="topbar">
      <div class="cluster">
        <AppBrand />
        <span
          class="pill pill-dot conn"
          :class="{ on: connected }"
          aria-live="polite"
          data-testid="board-conn"
        >
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
        <button
          class="btn sound"
          :class="{ active: sound }"
          data-testid="sound-toggle"
          :aria-pressed="sound"
          @click="toggleSound"
        >
          {{ sound ? '🔊' : '🔇' }} {{ $t('board.sound') }}
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
  flex-wrap: wrap;
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

.sun.active,
.sound.active {
  border-color: var(--accent);
  background: var(--surface-2);
}
</style>
