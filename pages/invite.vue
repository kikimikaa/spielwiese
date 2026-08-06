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
      <JoinQr class="qr-card" />
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

.qr-card {
  max-width: 22rem;
  width: 100%;
}
</style>
