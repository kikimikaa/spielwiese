<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const { t } = useI18n()

// Nuxt renders error.vue for any unhandled error; 404 gets its own copy, every
// other status falls back to the generic message.
const isNotFound = computed(() => props.error?.statusCode === 404)
const kind = computed(() => (isNotFound.value ? 'notFound' : 'generic'))
// 404 stays deliberately minimal (no emoji, no description); a generic error
// keeps the mascot and an explanatory line.
const emoji = computed(() => (isNotFound.value ? '' : '🌱'))

useHead({ title: () => `${props.error?.statusCode ?? '?'} · ${t('app.name')}` })

// clearError unmounts the error page; redirecting home also drops the broken URL.
function goHome() {
  clearError({ redirect: '/' })
}
// A generic error may be transient (e.g. the host server blipped), so retrying
// just reloads the same route rather than sending the guest away from it.
function tryAgain() {
  if (import.meta.client) window.location.reload()
}
</script>

<template>
  <div class="app-root">
    <header class="hd page-wide">
      <AppBrand />
      <LangToggle />
    </header>

    <main class="app-main">
      <div class="error-page" data-testid="error-page">
        <span v-if="emoji" class="emoji" aria-hidden="true">{{ emoji }}</span>
        <p class="code" data-testid="error-code">
          {{ $t('error.code', { code: error?.statusCode ?? '?' }) }}
        </p>
        <h1>{{ $t(`error.${kind}.title`) }}</h1>
        <p v-if="!isNotFound" class="muted desc">{{ $t('error.generic.desc') }}</p>

        <div class="cluster actions">
          <button type="button" class="btn btn-primary" data-testid="error-home" @click="goHome">
            {{ $t('error.backHome') }}
          </button>
          <button
            v-if="!isNotFound"
            type="button"
            class="btn"
            data-testid="error-retry"
            @click="tryAgain"
          >
            {{ $t('error.reload') }}
          </button>
        </div>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<style scoped>
.app-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.page-wide {
  max-width: var(--maxw);
  margin: 0 auto;
  width: 100%;
  padding: clamp(1rem, 3vw, 2rem);
}

.app-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(1rem, 3vw, 2rem);
}

.error-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.5rem;
  max-width: 32rem;
}

.emoji {
  font-size: clamp(3rem, 12vw, 4.5rem);
  line-height: 1;
}

.code {
  font-weight: 700;
  font-size: 0.9rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-soft);
  margin: 0;
}

.error-page h1 {
  font-size: clamp(1.8rem, 7vw, 2.75rem);
  font-weight: 800;
  margin: 0;
}

.desc {
  margin: 0;
  font-size: clamp(1rem, 3vw, 1.15rem);
  text-wrap: balance;
}

.actions {
  justify-content: center;
  margin-top: 1rem;
}
</style>
