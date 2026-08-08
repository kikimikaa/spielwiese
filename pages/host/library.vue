<script setup lang="ts">
const { t } = useI18n()
useHead({ title: () => `${t('host.library')} — ${t('app.name')}` })

const { pin, unlocked, error, ensureUnlocked } = useHost()

// The library lives behind the same PIN gate as /host. On a direct visit or
// refresh, re-validate the stored PIN; send the host to the unlock prompt only
// when there's no PIN or it was rejected — a transient failure keeps us here so
// a reload can recover in place.
onMounted(async () => {
  await ensureUnlocked()
  if (!unlocked.value && (!pin.value || error.value === 'wrongPin')) {
    await navigateTo('/host')
  }
})
</script>

<template>
  <div class="page">
    <AppHeader />
    <NuxtLink to="/host" class="btn back" data-testid="back-to-host">
      ‹ {{ $t('common.back') }}
    </NuxtLink>
    <HostLibrary v-if="unlocked" />
  </div>
</template>

<style scoped>
.back {
  margin-bottom: 1.25rem;
}
</style>
