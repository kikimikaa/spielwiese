<script setup lang="ts">
const { t } = useI18n()
useHead({ title: () => `${t('host.library')} — ${t('app.name')}` })

const { pin, unlocked, unlock } = useHost()

// The library lives behind the same PIN gate as /host. On a direct visit or
// refresh, re-validate the stored PIN; if there's none (or it fails), send the
// host back to the unlock prompt.
onMounted(async () => {
  if (!unlocked.value && pin.value) {
    try {
      await unlock(pin.value)
    } catch {
      // Stored PIN no longer valid — fall through to the redirect.
    }
  }
  if (!unlocked.value) await navigateTo('/host')
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
