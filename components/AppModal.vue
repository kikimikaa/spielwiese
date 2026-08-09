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

// Stable id so the dialog can be labelled by its title for screen readers.
const titleId = useId()

// Only teleport after mount: an SSR teleport to <body> can break page
// hydration (dead buttons). Disabled teleport renders in place, matching SSR.
const mounted = ref(false)
onMounted(() => {
  mounted.value = true
})

const dialog = ref<HTMLElement | null>(null)
// The element that had focus before the modal opened, restored on close.
let lastFocused: HTMLElement | null = null

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

function focusables(): HTMLElement[] {
  return dialog.value ? Array.from(dialog.value.querySelectorAll<HTMLElement>(FOCUSABLE)) : []
}

// Escape cancels; Tab is trapped so focus can't leave the open dialog.
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('cancel')
    return
  }
  if (e.key !== 'Tab') return
  const items = focusables()
  // Nothing tabbable inside — keep focus on the dialog rather than let it escape.
  if (items.length === 0) {
    e.preventDefault()
    return
  }
  const first = items[0]!
  const last = items[items.length - 1]!
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}

watch(
  () => props.open,
  async (open: boolean) => {
    if (!import.meta.client) return
    if (open) {
      lastFocused = document.activeElement as HTMLElement | null
      window.addEventListener('keydown', onKey)
      await nextTick()
      // Move focus into the dialog (first field/button, or the dialog itself).
      ;(focusables()[0] ?? dialog.value)?.focus()
    } else {
      window.removeEventListener('keydown', onKey)
      lastFocused?.focus?.()
      lastFocused = null
    }
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
        <div
          ref="dialog"
          class="modal card"
          :class="{ wide }"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="title ? titleId : undefined"
          tabindex="-1"
        >
          <h2 v-if="title" :id="titleId">{{ title }}</h2>
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
