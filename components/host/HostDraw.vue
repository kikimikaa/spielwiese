<script setup lang="ts">
import type { Player } from '../../core/types'

const DRAW_ANIMATION_MS = 1200

const { command } = useHost()
const { state, teams, playersOfTeam } = useTournamentState()

// Prefill from the saved roster (kept across a soft reset) or already-drawn
// players, so re-entering names is never necessary.
const initialNames = state.value?.roster?.length
  ? state.value.roster
  : (state.value?.players ?? []).map((p: Player) => p.name)
const names = ref(initialNames.join('\n'))
const drawing = ref(false)
const manual = ref(false)
const assign = reactive<Record<number, string>>({})

const parsedNames = computed<string[]>(() =>
  names.value
    .split('\n')
    .map((n: string) => n.trim())
    .filter(Boolean),
)
const hasTeams = computed(() => (state.value?.players.length ?? 0) > 0)

async function draw() {
  if (!parsedNames.value.length) return
  drawing.value = true
  // Purely cosmetic suspense before the teams appear.
  await new Promise((r) => setTimeout(r, DRAW_ANIMATION_MS))
  await command('draw', { names: parsedNames.value })
  drawing.value = false
}

function startManual() {
  if (!parsedNames.value.length) return
  parsedNames.value.forEach((_: string, i: number) => {
    assign[i] = teams.value[i % teams.value.length]?.id ?? ''
  })
  manual.value = true
}

async function applyManual() {
  const assignment = parsedNames.value.map((name: string, i: number) => ({
    name,
    teamId: assign[i] ?? teams.value[0]?.id ?? '',
  }))
  await command('setTeams', { assignment })
  manual.value = false
}

function rename(teamId: string, event: Event) {
  command('renameTeam', { teamId, name: (event.target as HTMLInputElement).value })
}
</script>

<template>
  <section class="stack" data-testid="host-draw">
    <div>
      <label class="label" for="names">{{ $t('host.namesLabel') }}</label>
      <textarea
        id="names"
        v-model="names"
        class="textarea"
        :placeholder="$t('host.namesPlaceholder')"
        data-testid="names-input"
      />
    </div>

    <div class="cluster">
      <button
        class="btn btn-primary"
        :disabled="drawing || !parsedNames.length"
        data-testid="draw-btn"
        @click="draw"
      >
        <span v-if="drawing">🎲 {{ $t('host.drawing') }}</span>
        <span v-else>🎲 {{ hasTeams ? $t('host.redraw') : $t('host.draw') }}</span>
      </button>
      <button
        class="btn"
        :disabled="!parsedNames.length"
        data-testid="assign-btn"
        @click="startManual"
      >
        ✍️ {{ $t('host.assignManually') }}
      </button>
    </div>

    <div v-if="manual" class="card stack" data-testid="manual-assign">
      <div v-for="(name, i) in parsedNames" :key="i" class="manual-row">
        <span class="mname">{{ name }}</span>
        <div class="cluster">
          <button
            v-for="team in teams"
            :key="team.id"
            class="btn team-pick"
            :class="{ picked: assign[i] === team.id }"
            :style="{ '--team': team.color }"
            @click="assign[i] = team.id"
          >
            {{ team.name }}
          </button>
        </div>
      </div>
      <div class="cluster">
        <button class="btn btn-primary" data-testid="apply-teams" @click="applyManual">
          {{ $t('host.applyTeams') }}
        </button>
        <button class="btn" @click="manual = false">{{ $t('common.cancel') }}</button>
      </div>
    </div>

    <div v-if="hasTeams && !drawing && !manual" class="teams" data-testid="drawn-teams">
      <div v-for="team in teams" :key="team.id" class="card team" :style="{ '--team': team.color }">
        <input
          class="team-name team-text"
          :value="team.name"
          :aria-label="$t('host.teamName')"
          @change="rename(team.id, $event)"
        />
        <ul>
          <li v-for="p in playersOfTeam(team.id)" :key="p.id">
            {{ p.name }}
            <span v-if="p.displayName" class="display muted" data-testid="player-display">
              · {{ p.displayName }}
            </span>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
.teams {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 13rem), 1fr));
  gap: 1rem;
}

.team {
  border-top: 6px solid var(--team);
}

.team-name {
  font: inherit;
  font-weight: 800;
  font-size: 1.2rem;
  border: none;
  border-bottom: 2px dashed var(--line);
  background: transparent;
  width: 100%;
  padding: 0.2rem 0;
  margin-bottom: 0.5rem;
}

.team ul {
  margin: 0;
  padding-left: 1.1rem;
}

.display {
  font-size: 0.85em;
  margin-left: 0.3rem;
}

.manual-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.mname {
  font-weight: 700;
}

.team-pick {
  border-left: 6px solid var(--team);
  font-weight: 700;
}

.team-pick.picked {
  background: var(--team);
  color: #fff;
  border-color: var(--team);
}
</style>
