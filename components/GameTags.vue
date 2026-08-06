<script setup lang="ts">
import type { Game } from '../core/types'

defineProps<{ game: Pick<Game, 'location' | 'scoringType'> }>()
</script>

<template>
  <div class="cluster tags">
    <span class="pill" data-testid="tag-location">{{ $t(`location.${game.location}`) }}</span>
    <span class="pill" data-testid="tag-scoring">{{ $t(`scoring.${game.scoringType}`) }}</span>
  </div>
</template>

<style scoped>
.tags {
  gap: 0.4rem;
}
</style>
