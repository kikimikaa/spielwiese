<script setup lang="ts">
const { version } = useRuntimeConfig().public

// Support link — the same Ko-fi page the README points at.
const KOFI_URL = 'https://ko-fi.com/I4N620AYLT'
</script>

<template>
  <footer class="app-footer">
    <span>{{ $t('footer.madeBy') }}</span>
    <span class="sep" aria-hidden="true">·</span>
    <a :href="KOFI_URL" class="kofi" target="_blank" rel="noopener" data-testid="kofi-link">
      <span aria-hidden="true">☕</span> {{ $t('footer.support') }}
    </a>
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

.sep {
  opacity: 0.5;
}

/* Subtle by default — inherits the muted footer colour, warms up on hover. */
.kofi {
  color: inherit;
  text-decoration: none;
  opacity: 0.9;
}

.kofi:hover {
  color: var(--accent);
  text-decoration: underline;
}

.ver {
  opacity: 0.7;
  font-variant-numeric: tabular-nums;
}
</style>
