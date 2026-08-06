<script setup lang="ts">
const { t } = useI18n()
useHead({ title: () => `${t('nav.join')} — ${t('app.name')}` })

const { players, playerById, teamById, playersOfTeam } = useTournamentState()
const { playerId, join, leave } = useGuest()

const me = computed(() => playerById(playerId.value))
const identified = computed(() => Boolean(me.value))
const myTeam = computed(() => teamById(me.value?.teamId))
const myTeamMembers = computed(() => (me.value?.teamId ? playersOfTeam(me.value.teamId) : []))

const realNameDraft = ref('')
const displayDraft = ref('')
const joinError = ref<string | null>(null)
const joining = ref(false)

async function confirmJoin() {
  if (!realNameDraft.value.trim() || !displayDraft.value.trim()) return
  joining.value = true
  joinError.value = null
  try {
    await join(realNameDraft.value, displayDraft.value)
  } catch (e: unknown) {
    // h3 nests custom error data under `data`; ofetch may surface it flat too.
    const err = e as { data?: { reason?: string; data?: { reason?: string } } }
    joinError.value = err.data?.data?.reason ?? err.data?.reason ?? 'generic'
  } finally {
    joining.value = false
  }
}
</script>

<template>
  <div class="page">
    <AppHeader />

    <!-- 1) Teams not drawn yet -->
    <div v-if="!players.length" class="card" data-testid="join-waiting">
      <h1>{{ $t('join.title') }}</h1>
      <p class="muted">{{ $t('join.waitingDraw') }}</p>
    </div>

    <!-- 2) Identify: type your real name, then a display name -->
    <form
      v-else-if="!identified"
      class="card stack"
      data-testid="identify"
      @submit.prevent="confirmJoin"
    >
      <h1>{{ $t('join.pickPlayer') }}</h1>
      <p class="muted">{{ $t('join.howto') }}</p>

      <div>
        <label class="label" for="realname">{{ $t('join.realName') }}</label>
        <input
          id="realname"
          v-model="realNameDraft"
          class="input"
          :placeholder="$t('join.realNamePlaceholder')"
          autocomplete="off"
          data-testid="realname-input"
        />
      </div>

      <div>
        <label class="label" for="display">{{ $t('join.displayName') }}</label>
        <input
          id="display"
          v-model="displayDraft"
          class="input"
          :placeholder="$t('join.namePlaceholder')"
          autocomplete="off"
          data-testid="display-input"
        />
        <p class="muted small">{{ $t('join.displayNameHint') }}</p>
      </div>

      <p v-if="joinError" class="err" data-testid="join-error">
        {{ $t(`join.errors.${joinError}`) }}
      </p>

      <button
        class="btn btn-primary"
        type="submit"
        :disabled="joining || !realNameDraft.trim() || !displayDraft.trim()"
        data-testid="join-confirm"
      >
        {{ $t('join.join') }}
      </button>
    </form>

    <!-- 3) Identified: who you are + your team -->
    <div v-else class="stack">
      <div class="card identity" data-testid="identity">
        <div class="who">
          <span class="muted">{{ $t('join.youAre') }}</span>
          <strong>{{ me?.name }}</strong>
          <span class="muted">·</span>
          <span class="muted">{{ $t('join.shownAs') }}</span>
          <strong>{{ me?.displayName }}</strong>
        </div>
        <button class="btn" data-testid="leave" @click="leave">{{ $t('join.notYou') }}</button>
      </div>

      <section
        v-if="myTeam"
        class="card team-card"
        :style="{ '--team': myTeam.color }"
        data-testid="my-team"
      >
        <div class="label">{{ $t('join.yourTeam') }}</div>
        <div class="team-name">{{ myTeam.name }}</div>
        <ul class="members">
          <li v-for="p in myTeamMembers" :key="p.id" :class="{ self: p.id === playerId }">
            <span>{{ p.name }}</span>
            <span v-if="p.displayName" class="alias muted">· {{ p.displayName }}</span>
            <span v-if="p.id === playerId" class="you muted">({{ $t('join.you') }})</span>
          </li>
        </ul>
      </section>

      <NuxtLink to="/board" class="btn btn-primary btn-block" data-testid="to-board">
        {{ $t('join.toBoard') }}
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.identity {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

/* Flex gap gives reliable spacing — Vue trims text whitespace between tags. */
.who {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35rem;
}

.small {
  font-size: 0.85rem;
}

.err {
  color: var(--danger);
  font-weight: 600;
  margin: 0;
}

.team-card {
  border-top: 6px solid var(--team);
}

.team-name {
  font-weight: 800;
  font-size: 1.3rem;
  color: var(--team);
  margin: 0.2rem 0 0.6rem;
}

.members {
  margin: 0;
  padding-left: 1.1rem;
  display: grid;
  gap: 0.25rem;
}

.members li {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  align-items: baseline;
}

.members .self {
  font-weight: 800;
}

.alias {
  font-size: 0.9em;
}

.you {
  font-size: 0.85em;
}
</style>
