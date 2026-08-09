<script setup lang="ts">
import type { PauseMode, TournamentStatus } from '../core/types'

const { t } = useI18n()
useHead({ title: () => `${t('nav.board')} — ${t('app.name')}` })

const { state, connected } = useTournamentState()
const { enabled: sun, toggle: toggleSun } = useSunMode()
const {
  enabled: sound,
  toggle: toggleSound,
  playWin,
  playFanfare,
  playCountdown,
  playDrumroll,
} = useSound()
const { theme, cycle: cycleTheme } = useTheme()

// The board is where the atmosphere lives — all no-ops unless the host switched
// sound on. A chime on each win; a get-ready countdown when a new game starts; a
// drumroll on the pre-ceremony suspense pause; a fanfare when the winner shows.
// Each watcher fires only on a real change (never on the initial page load).
useGameWins(() => playWin())
watch(
  () => state.value?.status,
  (status: TournamentStatus | undefined, prev: TournamentStatus | undefined) => {
    if (status === 'finished' && prev && prev !== 'finished') playFanfare()
  },
)
watch(
  () => state.value?.currentGameId,
  (id: string | null | undefined, prev: string | null | undefined) => {
    // `prev === undefined` is the pre-hydration baseline (state was still null) —
    // skip it so a reload mid-game doesn't fire a phantom countdown. A real
    // deselect→select has `prev === null`, which still counts.
    if (id && prev !== undefined && id !== prev && state.value?.status === 'running') {
      playCountdown()
    }
  },
)
watch(
  () => state.value?.pause,
  (mode: PauseMode | undefined, prev: PauseMode | undefined) => {
    if (mode === 'suspense' && prev && prev !== 'suspense') playDrumroll()
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
        <button
          class="btn theme"
          data-testid="theme-toggle"
          :aria-label="$t('board.theme.aria', { name: $t(`board.theme.${theme}`) })"
          @click="cycleTheme"
        >
          <span aria-hidden="true">🎨</span> {{ $t(`board.theme.${theme}`) }}
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
