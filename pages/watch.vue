<script setup lang="ts">
const { t } = useI18n()
useHead({ title: () => `${t('nav.watch')} — ${t('app.name')}` })
</script>

<template>
  <div class="page" data-testid="watch">
    <AppHeader />
    <div class="muted eyebrow">{{ $t('watch.title') }}</div>
    <BoardStage />
  </div>
</template>

<style scoped>
.eyebrow {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.8rem;
  margin-bottom: 0.75rem;
}
</style>
