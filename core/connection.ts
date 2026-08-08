// Live-connection helpers: pure and framework-free so the reconnect timing and
// the banner-visibility rule can be unit-tested without a socket or a DOM.
import { RECONNECT_BASE_MS, RECONNECT_MAX_MS } from './constants'

/**
 * Capped linear backoff for the nth reconnect attempt: `base · attempts`, never
 * above the ceiling and never below one base interval (so `attempts` of 0 still
 * waits a full step before retrying).
 */
export function reconnectDelay(attempts: number): number {
  const steps = attempts > 0 ? attempts : 1
  return Math.min(RECONNECT_BASE_MS * steps, RECONNECT_MAX_MS)
}

export interface ConnectionView {
  connected: boolean
  /** Whether the socket has ever been open — distinguishes a real drop from a slow first connect. */
  everConnected: boolean
  /** Whether the initial grace period has elapsed without a first connection. */
  graceElapsed: boolean
}

/**
 * Whether to surface the reconnect banner. Hidden while connected, and — to
 * avoid a flash on every page load — only shown once a connection has actually
 * dropped or the first-connect grace period has run out.
 */
export function shouldShowReconnectBanner(view: ConnectionView): boolean {
  return !view.connected && (view.everConnected || view.graceElapsed)
}
