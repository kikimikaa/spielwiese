<script setup lang="ts">
const { t } = useI18n()
useHead({ title: () => t('app.name') })

const tiles = [
  { to: '/board', key: 'board', emoji: '📊' },
  { to: '/host', key: 'host', emoji: '🎛️' },
  { to: '/join', key: 'join', emoji: '🙋' },
  { to: '/bets', key: 'bets', emoji: '🎲' },
  { to: '/watch', key: 'watch', emoji: '👀' },
  { to: '/invite', key: 'invite', emoji: '📨' },
] as const
</script>

<template>
  <div class="page">
    <AppHeader />
    <div class="stack hero">
      <h1>{{ $t('app.name') }}</h1>
      <p class="muted">{{ $t('home.subtitle') }}</p>
    </div>
    <nav class="tiles">
      <NuxtLink
        v-for="tile in tiles"
        :key="tile.key"
        :to="tile.to"
        class="card tile"
        :data-testid="`tile-${tile.key}`"
      >
        <span class="emoji" aria-hidden="true">{{ tile.emoji }}</span>
        <span class="tile-title">{{ $t(`nav.${tile.key}`) }}</span>
        <span class="muted">{{ $t(`home.${tile.key}Desc`) }}</span>
      </NuxtLink>
    </nav>
  </div>
</template>

<style scoped>
.hero {
  gap: 0.25rem;
  margin-bottom: 1.5rem;
}

.hero h1 {
  font-size: clamp(2.2rem, 9vw, 3.5rem);
  font-weight: 800;
}

.tiles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));
  gap: 1rem;
}

.tile {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  text-decoration: none;
  transition:
    transform 0.08s ease,
    border-color 0.15s ease;
}

.tile:hover {
  transform: translateY(-2px);
  border-color: var(--accent);
}

.emoji {
  font-size: 2rem;
}

.tile-title {
  font-weight: 700;
  font-size: 1.25rem;
}
</style>
