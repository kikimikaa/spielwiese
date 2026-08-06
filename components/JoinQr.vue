<script setup lang="ts">
import QRCode from 'qrcode'

// QR points at the join page on this same host, so guests scan the board and
// land straight on their own device to enter a name and predict.
const qr = ref('')
const url = ref('')

onMounted(async () => {
  url.value = `${location.origin}/join`
  qr.value = await QRCode.toDataURL(url.value, { margin: 1, width: 240 })
})
</script>

<template>
  <div class="join-qr card" data-testid="join-qr">
    <div class="muted eyebrow">{{ $t('invite.hint') }}</div>
    <img v-if="qr" :src="qr" :alt="$t('nav.join')" width="180" height="180" />
    <div class="url muted">{{ url }}</div>
  </div>
</template>

<style scoped>
.join-qr {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  text-align: center;
}

.eyebrow {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.8rem;
}

.join-qr img {
  border-radius: var(--radius-sm);
}

.url {
  font-size: 0.85rem;
  word-break: break-all;
}
</style>
