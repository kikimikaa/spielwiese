import type { TournamentState } from '../core/types'
import { WS_ROUTE } from '../core/constants'

const RECONNECT_BASE_MS = 1000
const RECONNECT_MAX_MS = 10000

/**
 * Opens the live WebSocket and mirrors every pushed state into shared useState.
 * Client-only. Resilient by design:
 *  - auto-reconnects with a capped backoff after any drop;
 *  - reconnects immediately when the device comes back (tab visible, window
 *    focused, network online) — phones throttle background timers, so waking
 *    the page must trigger an instant reconnect;
 *  - on every (re)connect the server pushes the full state, so a device that
 *    was closed or asleep catches up completely the moment it returns.
 */
export default defineNuxtPlugin(() => {
  const state = useState<TournamentState | null>('tournament-state')
  const connected = useState<boolean>('tournament-connected', () => false)

  let socket: WebSocket | null = null
  let timer: ReturnType<typeof setTimeout> | null = null
  let attempts = 0

  const wsUrl = () => {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws'
    return `${proto}://${location.host}${WS_ROUTE}`
  }

  const clearTimer = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  const connect = () => {
    clearTimer()
    const alive =
      socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)
    if (alive) return

    socket = new WebSocket(wsUrl())
    socket.onopen = () => {
      attempts = 0
      connected.value = true
    }
    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      if (msg.type === 'state') state.value = msg.state
    }
    socket.onclose = () => {
      connected.value = false
      attempts += 1
      timer = setTimeout(connect, Math.min(RECONNECT_BASE_MS * attempts, RECONNECT_MAX_MS))
    }
    socket.onerror = () => socket?.close()
  }

  // Reconnect the instant the user/device is back in front of the page.
  const wake = () => {
    if (document.visibilityState === 'visible') {
      attempts = 0
      connect()
    }
  }

  connect()
  window.addEventListener('online', () => {
    attempts = 0
    connect()
  })
  window.addEventListener('focus', wake)
  document.addEventListener('visibilitychange', wake)

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      clearTimer()
      socket?.close()
    })
  }
})
