<script setup lang="ts">
const { teams, playerLabel, playersOfTeam } = useTournamentState()
</script>

<template>
  <div class="board-teams" data-testid="board-teams">
    <div v-for="team in teams" :key="team.id" class="card team" :style="{ '--team': team.color }">
      <div class="tname">{{ team.name }}</div>
      <ul class="members">
        <li v-for="p in playersOfTeam(team.id)" :key="p.id">{{ playerLabel(p.id) }}</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.board-teams {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
  gap: clamp(0.75rem, 2vw, 1.25rem);
}

.team {
  border-top: 8px solid var(--team);
}

.tname {
  font-weight: 800;
  font-size: clamp(1.3rem, 4vw, 2rem);
  color: var(--team);
  margin-bottom: 0.5rem;
}

.members {
  margin: 0;
  padding-left: 1.2rem;
  font-size: clamp(1rem, 2.5vw, 1.4rem);
  display: grid;
  gap: 0.2rem;
}
</style>
