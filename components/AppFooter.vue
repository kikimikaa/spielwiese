<script setup lang="ts">
const { version } = useRuntimeConfig().public
</script>

<template>
  <footer class="app-footer">
    <span>{{ $t('footer.madeBy') }}</span>
    <span class="ver">v{{ version }}</span>
  </footer>
</template>

<style scoped>
.app-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  align-items: center;
  padding: 1.25rem 1rem;
  color: var(--ink-soft);
  font-size: 0.85rem;
}

.ver {
  opacity: 0.7;
  font-variant-numeric: tabular-nums;
}
</style>
