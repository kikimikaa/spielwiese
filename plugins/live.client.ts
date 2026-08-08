import type { TournamentState } from '../core/types'
import { WS_ROUTE } from '../core/constants'
import { reconnectDelay } from '../core/connection'

/**
 * Opens the live WebSocket and mirrors every pushed state into shared useState.
 * Client-only. Resilient by design:
 *  - auto-reconnects with a capped backoff after any drop;
 *  - reconnects immediately when the device comes back (tab visible, window
 *    focused, network online) — phones throttle background timers, so waking
 *    the page must trigger an instant reconnect;
 *  - exposes a manual "reconnect now" to the UI (the banner's retry button);
 *  - on every (re)connect the server pushes the full state, so a device that
 *    was closed or asleep catches up completely the moment it returns.
 */
export default defineNuxtPlugin(() => {
  const state = useState<TournamentState | null>('tournament-state')
  const connected = useState<boolean>('tournament-connected', () => false)
  const everConnected = useState<boolean>('tournament-ever-connected', () => false)

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
      everConnected.value = true
    }
    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      if (msg.type === 'state') state.value = msg.state
    }
    socket.onclose = () => {
      connected.value = false
      attempts += 1
      timer = setTimeout(connect, reconnectDelay(attempts))
    }
    socket.onerror = () => socket?.close()
  }

  // A manual retry (or a device waking) should not wait out the current backoff.
  const reconnectNow = () => {
    attempts = 0
    connect()
  }

  // Reconnect the instant the user/device is back in front of the page.
  const wake = () => {
    if (document.visibilityState === 'visible') reconnectNow()
  }

  registerReconnect(reconnectNow)
  connect()
  window.addEventListener('online', reconnectNow)
  window.addEventListener('focus', wake)
  document.addEventListener('visibilitychange', wake)

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      clearTimer()
      socket?.close()
    })
  }
})
