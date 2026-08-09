<script setup lang="ts">
const { connected } = useTournamentState()
</script>

<template>
  <header class="hd">
    <AppBrand />
    <div class="cluster">
      <span
        class="pill pill-dot conn"
        :class="{ on: connected }"
        :title="connected ? $t('home.connected') : $t('home.offline')"
        aria-live="polite"
        data-testid="conn-state"
      >
        {{ connected ? $t('home.connected') : $t('home.offline') }}
      </span>
      <LangToggle />
    </div>
  </header>
</template>

<style scoped>
.hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.conn {
  color: var(--danger);
}

.conn.on {
  color: var(--accent);
}
</style>
