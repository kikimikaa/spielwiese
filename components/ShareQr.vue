<script setup lang="ts">
import QRCode from 'qrcode'

// A shareable QR + link for one page on this same host (join, watch, …). If the
// board is opened on the host machine via `localhost`, that address is useless on
// a phone — we swap in the server's LAN IP so the QR is scannable from any device.
const props = defineProps<{
  path: string
  hint: string
  caption: string
}>()

const qr = ref('')
const url = ref('')

const LOOPBACK_HOSTS = ['localhost', '127.0.0.1', '[::1]', '::1']

async function shareOrigin(): Promise<string> {
  if (!LOOPBACK_HOSTS.includes(location.hostname)) return location.origin
  try {
    const { ip } = await $fetch<{ ip: string | null }>('/api/lan')
    if (ip) {
      const port = location.port ? `:${location.port}` : ''
      return `${location.protocol}//${ip}${port}`
    }
  } catch {
    // Fall back to the current origin; the banner already warns if no LAN IP.
  }
  return location.origin
}

onMounted(async () => {
  url.value = `${await shareOrigin()}${props.path}`
  qr.value = await QRCode.toDataURL(url.value, { margin: 1, width: 240 })
})
</script>

<template>
  <div class="share-qr card" data-testid="share-qr">
    <div class="muted eyebrow">{{ hint }}</div>
    <img v-if="qr" :src="qr" :alt="caption" width="180" height="180" />
    <div class="url muted">{{ url }}</div>
  </div>
</template>

<style scoped>
.share-qr {
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

.share-qr img {
  border-radius: var(--radius-sm);
}

.url {
  font-size: 0.85rem;
  word-break: break-all;
}
</style>
