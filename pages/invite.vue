<script setup lang="ts">
const { t } = useI18n()
useHead({ title: () => `${t('nav.invite')} — ${t('app.name')}` })
</script>

<template>
  <div class="page">
    <AppHeader />
    <div class="stack invite">
      <div class="head">
        <h1>{{ $t('invite.title') }}</h1>
      </div>
      <div class="qr-grid">
        <ShareQr class="qr-card" path="/join" :hint="$t('invite.hint')" :caption="$t('nav.join')" />
        <ShareQr
          class="qr-card"
          path="/watch"
          :hint="$t('invite.watchHint')"
          :caption="$t('nav.watch')"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.invite {
  align-items: center;
  text-align: center;
}

.head {
  max-width: 32rem;
}

.qr-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
  gap: 1rem;
  width: 100%;
  max-width: 40rem;
}

.qr-card {
  width: 100%;
}
</style>
