<script setup lang="ts">
import { CONNECTION_GRACE_MS } from '../core/constants'
import { shouldShowReconnectBanner } from '../core/connection'

const { connected, everConnected, reconnectNow } = useLiveConnection()

// After a fresh load we wait out a short grace period before admitting we're not
// connected yet, so a normal handshake never flashes the banner.
const graceElapsed = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null
onMounted(() => {
  timer = setTimeout(() => (graceElapsed.value = true), CONNECTION_GRACE_MS)
})
onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})

const visible = computed(() =>
  shouldShowReconnectBanner({
    connected: connected.value,
    everConnected: everConnected.value,
    graceElapsed: graceElapsed.value,
  }),
)
// A real drop reads differently from a slow first connect.
const messageKey = computed(() =>
  everConnected.value ? 'connection.lost' : 'connection.connecting',
)
</script>

<template>
  <Transition name="drop">
    <div
      v-if="visible"
      class="conn-banner"
      role="status"
      aria-live="polite"
      data-testid="conn-banner"
    >
      <span class="conn-dot" aria-hidden="true"></span>
      <span class="conn-msg">{{ $t(messageKey) }}</span>
      <button class="btn conn-retry" data-testid="conn-retry" @click="reconnectNow">
        {{ $t('connection.retry') }}
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.conn-banner {
  position: sticky;
  top: 0;
  /* Above page content, but below modals (100) so a dialog still wins. */
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 1rem;
  background: var(--danger);
  color: #fff;
  font-weight: 700;
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.2);
}

.conn-dot {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
  background: #fff;
  flex: none;
  animation: pulse 1.2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.35;
  }
  50% {
    opacity: 1;
  }
}

.conn-msg {
  flex: 1;
}

/* White button, readable on the red bar in both light and sun mode. Keeps the
   global 44px touch target — this is tapped in a hurry on a phone. */
.conn-retry {
  flex: none;
  padding: 0.35rem 0.9rem;
  background: #fff;
  color: var(--danger);
  border-color: #fff;
  font-weight: 700;
}

.drop-enter-active,
.drop-leave-active {
  transition:
    transform 0.25s ease,
    opacity 0.25s ease;
}

.drop-enter-from,
.drop-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .conn-dot {
    animation: none;
  }
  .drop-enter-active,
  .drop-leave-active {
    transition: none;
  }
}
</style>
