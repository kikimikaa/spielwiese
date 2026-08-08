<script setup lang="ts">
const { t } = useI18n()
useHead({ title: () => `${t('host.title')} — ${t('app.name')}` })

const { state, teams, totals, leader } = useTournamentState()
const { pin, unlocked, error, unlock, command } = useHost()

const pinInput = ref('')

async function doUnlock() {
  try {
    await unlock(pinInput.value)
  } catch {
    // error flag is set inside useHost; nothing else to do here.
  }
}

// Re-validate a stored PIN on load so a returning host skips the prompt.
onMounted(async () => {
  if (pin.value && !unlocked.value) {
    try {
      await unlock(pin.value)
    } catch {
      // Stored PIN no longer valid — fall back to the prompt.
    }
  }
})

const pause = computed(() => state.value?.pause ?? 'none')
const status = computed(() => state.value?.status ?? 'setup')

function togglePause(mode: 'break' | 'suspense') {
  command('setPause', { mode: pause.value === mode ? 'none' : mode })
}

function toggleStatus(target: 'awards' | 'finished') {
  command('setStatus', { status: status.value === target ? 'running' : target })
}

const confirmReset = ref(false)
const confirmEnd = ref(false)

async function doReset() {
  await command('softReset')
  confirmReset.value = false
}

async function doEnd() {
  await command('endTournament')
  confirmEnd.value = false
}
</script>

<template>
  <div class="page">
    <AppHeader />

    <form v-if="!unlocked" class="card stack" data-testid="pin-form" @submit.prevent="doUnlock">
      <h1>{{ $t('host.title') }}</h1>
      <label class="label" for="pin">{{ $t('host.pinPrompt') }}</label>
      <input
        id="pin"
        v-model="pinInput"
        class="input"
        type="password"
        inputmode="numeric"
        :placeholder="$t('host.pinPlaceholder')"
        data-testid="pin-input"
      />
      <p v-if="error === 'wrongPin'" class="err" data-testid="pin-error">
        {{ $t('host.wrongPin') }}
      </p>
      <button class="btn btn-primary" data-testid="pin-submit">{{ $t('host.unlock') }}</button>
    </form>

    <div v-else class="stack sections">
      <section>
        <h2>{{ $t('board.scoreboard') }}</h2>
        <ScoreBoard :teams="teams" :totals="totals" :leader-id="leader" />
      </section>

      <section>
        <h2>{{ $t('host.sections.draw') }}</h2>
        <HostDraw />
      </section>

      <section>
        <h2>{{ $t('host.sections.games') }}</h2>
        <HostGames />
      </section>

      <section>
        <h2>{{ $t('host.sections.control') }}</h2>
        <div class="cluster">
          <button
            class="btn toggle"
            :class="{ active: pause === 'break' }"
            :aria-pressed="pause === 'break'"
            data-testid="pause-break"
            @click="togglePause('break')"
          >
            ⏸ {{ $t('host.pause') }}
          </button>
          <button
            class="btn toggle"
            :class="{ active: pause === 'suspense' }"
            :aria-pressed="pause === 'suspense'"
            data-testid="pause-suspense"
            @click="togglePause('suspense')"
          >
            {{ $t('host.pauseCeremony') }}
          </button>
          <button
            class="btn toggle"
            :class="{ active: status === 'awards' }"
            :aria-pressed="status === 'awards'"
            data-testid="show-awards"
            @click="toggleStatus('awards')"
          >
            {{ $t('host.showAwards') }}
          </button>
          <button
            class="btn toggle"
            :class="{ active: status === 'finished' }"
            :aria-pressed="status === 'finished'"
            data-testid="start-ceremony"
            @click="toggleStatus('finished')"
          >
            {{ $t('host.startCeremony') }}
          </button>
        </div>
      </section>

      <section v-if="status === 'awards' || status === 'finished'">
        <h2>{{ $t('host.sections.awards') }}</h2>
        <p class="muted hint">{{ $t('host.awards.hint') }}</p>
        <HostAwards />
      </section>

      <section>
        <h2>{{ $t('host.sections.danger') }}</h2>
        <div class="cluster">
          <button class="btn btn-danger" data-testid="reset" @click="confirmReset = true">
            {{ $t('host.reset') }}
          </button>
          <button class="btn btn-danger" data-testid="end-tournament" @click="confirmEnd = true">
            {{ $t('host.endTournament') }}
          </button>
        </div>
      </section>
    </div>

    <AppModal
      :open="confirmReset"
      :title="$t('host.reset')"
      :message="$t('host.resetConfirm')"
      :confirm-label="$t('host.reset')"
      danger
      @confirm="doReset"
      @cancel="confirmReset = false"
    />

    <AppModal
      :open="confirmEnd"
      :title="$t('host.endTournament')"
      :message="$t('host.endTournamentConfirm')"
      :confirm-label="$t('host.endTournament')"
      danger
      @confirm="doEnd"
      @cancel="confirmEnd = false"
    />
  </div>
</template>

<style scoped>
.sections {
  gap: 2rem;
}

.sections h2 {
  border-bottom: 2px solid var(--line);
  padding-bottom: 0.3rem;
}

.toggle.active {
  border-color: var(--accent);
  border-width: 2px;
  background: var(--surface-2);
}

.hint {
  margin: -0.25rem 0 0.75rem;
}
</style>
