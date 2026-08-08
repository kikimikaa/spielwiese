<script setup lang="ts">
const props = defineProps<{
  open: boolean
  title?: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  /** Hide the built-in cancel/confirm footer (slot content brings its own). */
  hideActions?: boolean
  /** Wider dialog for form content. */
  wide?: boolean
}>()
const emit = defineEmits<{ confirm: []; cancel: [] }>()

// Only teleport after mount: an SSR teleport to <body> can break page
// hydration (dead buttons). Disabled teleport renders in place, matching SSR.
const mounted = ref(false)
onMounted(() => {
  mounted.value = true
})

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('cancel')
}

watch(
  () => props.open,
  (open: boolean) => {
    if (!import.meta.client) return
    if (open) window.addEventListener('keydown', onKey)
    else window.removeEventListener('keydown', onKey)
  },
)

onUnmounted(() => {
  if (import.meta.client) window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <Teleport to="body" :disabled="!mounted">
    <Transition name="modal">
      <div v-if="open" class="overlay" data-testid="modal" @click.self="emit('cancel')">
        <div class="modal card" :class="{ wide }" role="dialog" aria-modal="true">
          <div v-if="title || $slots['headerActions']" class="modal-header">
            <h2 v-if="title">{{ title }}</h2>
            <slot name="headerActions" />
          </div>
          <p v-if="message" class="muted msg">{{ message }}</p>
          <slot />
          <div v-if="!hideActions" class="cluster actions">
            <button class="btn" data-testid="modal-cancel" @click="emit('cancel')">
              {{ cancelLabel ?? $t('common.cancel') }}
            </button>
            <button
              class="btn"
              :class="danger ? 'btn-danger' : 'btn-primary'"
              data-testid="modal-confirm"
              @click="emit('confirm')"
            >
              {{ confirmLabel ?? $t('common.confirm') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(20, 16, 8, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 100;
}

.modal {
  width: 100%;
  max-width: 26rem;
  max-height: 90vh;
  overflow-y: auto;
}

.modal.wide {
  max-width: 34rem;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.4em;
}

.modal-header h2 {
  margin: 0;
}

.msg {
  margin: 0.25rem 0 0;
}

.actions {
  margin-top: 1.25rem;
  justify-content: flex-end;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.15s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
