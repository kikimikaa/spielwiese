<script setup lang="ts">
const { locale, setLocale } = useI18n()
const other = computed(() => (locale.value === 'de' ? 'en' : 'de'))
</script>

<template>
  <button
    class="btn"
    data-testid="lang-toggle"
    :aria-label="$t('lang.label')"
    @click="setLocale(other)"
  >
    {{ $t(`lang.${other}`) }}
  </button>
</template>
