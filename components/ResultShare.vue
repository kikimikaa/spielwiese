<script setup lang="ts">
// A shareable summary of the finished tournament, for watchers on their own
// device: uses the native share sheet where available, otherwise copies the
// result to the clipboard. Only rendered once the ceremony is finished.
const { t } = useI18n()
const { state, tournamentWinner, teamById, totals } = useTournamentState()

// How long the "copied" confirmation stays up after a clipboard fallback.
const COPIED_FEEDBACK_MS = 2000

const winner = computed(() => teamById(tournamentWinner.value))

const summary = computed(() => {
  const name = state.value?.name || t('app.name')
  const w = winner.value
  if (w) {
    return t('watch.share.won', { winner: w.name, points: totals.value[w.id] ?? 0, name })
  }
  return t('watch.share.tie', { name })
})

const copied = ref(false)

async function share() {
  const url = `${location.origin}/watch`
  const data = { title: t('app.name'), text: summary.value, url }
  if (navigator.share) {
    // The user may dismiss the share sheet — that's not an error worth surfacing.
    try {
      await navigator.share(data)
    } catch {
      /* cancelled */
    }
    return
  }
  try {
    await navigator.clipboard.writeText(`${summary.value} ${url}`)
    copied.value = true
    setTimeout(() => (copied.value = false), COPIED_FEEDBACK_MS)
  } catch {
    /* clipboard unavailable — nothing more we can do */
  }
}
</script>

<template>
  <section class="card share" data-testid="result-share">
    <p class="summary">{{ summary }}</p>
    <button class="btn btn-primary" data-testid="share-btn" @click="share">
      🔗 {{ copied ? $t('watch.share.copied') : $t('watch.share.button') }}
    </button>
  </section>
</template>

<style scoped>
.share {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  align-items: flex-start;
}

.summary {
  margin: 0;
  font-weight: 700;
  text-wrap: balance;
}
</style>
