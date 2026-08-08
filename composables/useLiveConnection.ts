// Shared live-connection status plus a manual reconnect trigger. The client
// plugin owns the socket and registers its reconnect function here; components
// read the status and can ask for an immediate retry.

// Module-level so the (client-only) plugin can hand its reconnect trigger to the
// UI without serialising a function through useState. Stays null on the server.
let reconnectImpl: (() => void) | null = null

/** Called once by the live plugin to expose its "reconnect now" action to the UI. */
export function registerReconnect(fn: () => void): void {
  reconnectImpl = fn
}

export function useLiveConnection() {
  const connected = useState<boolean>('tournament-connected', () => false)
  // Set true on the first successful open; lets the UI tell a drop apart from a slow start.
  const everConnected = useState<boolean>('tournament-ever-connected', () => false)

  function reconnectNow(): void {
    reconnectImpl?.()
  }

  return { connected, everConnected, reconnectNow }
}
