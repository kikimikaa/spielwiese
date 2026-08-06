<script setup lang="ts">
defineProps<{ small?: boolean }>()
</script>

<template>
  <NuxtLink to="/" class="brand" :class="{ small }" data-testid="brand">
    <span class="dot" aria-hidden="true" />
    {{ $t('app.name') }}
  </NuxtLink>
</template>

<style scoped>
.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 800;
  font-size: 1.15rem;
  text-decoration: none;
  letter-spacing: -0.02em;
  color: inherit;
}

.dot {
  width: 1rem;
  height: 1rem;
  border-radius: 6px;
  background: var(--accent);
}
</style>
