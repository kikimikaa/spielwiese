<script setup lang="ts">
const { t } = useI18n()
useHead({ title: () => `${t('nav.watch')} — ${t('app.name')}` })

const { state } = useTournamentState()
const finished = computed(() => state.value?.status === 'finished')
</script>

<template>
  <div class="page" data-testid="watch">
    <AppHeader />
    <div class="muted eyebrow">{{ $t('watch.title') }}</div>
    <WatchPersonal class="mb" />
    <BoardStage />
    <WatchActivity class="mt" />
    <ResultShare v-if="finished" class="mt" />
  </div>
</template>

<style scoped>
.eyebrow {
  margin-bottom: 0.75rem;
}

.mb {
  margin-bottom: clamp(1rem, 3vw, 1.75rem);
}

.mt {
  margin-top: clamp(1rem, 3vw, 1.75rem);
}
</style>
