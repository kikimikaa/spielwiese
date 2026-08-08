import { describe, expect, it } from 'vitest'
import { reconnectDelay, shouldShowReconnectBanner } from '../core/connection'
import { RECONNECT_BASE_MS, RECONNECT_MAX_MS } from '../core/constants'

describe('reconnectDelay', () => {
  it('grows one base step per attempt', () => {
    expect(reconnectDelay(1)).toBe(RECONNECT_BASE_MS)
    expect(reconnectDelay(3)).toBe(RECONNECT_BASE_MS * 3)
  })

  it('caps at the ceiling for large attempt counts', () => {
    expect(reconnectDelay(1000)).toBe(RECONNECT_MAX_MS)
  })

  it('waits at least one base step for a zero or negative attempt', () => {
    expect(reconnectDelay(0)).toBe(RECONNECT_BASE_MS)
    expect(reconnectDelay(-5)).toBe(RECONNECT_BASE_MS)
  })
})

describe('shouldShowReconnectBanner', () => {
  it('stays hidden while connected, whatever else is true', () => {
    expect(
      shouldShowReconnectBanner({ connected: true, everConnected: true, graceElapsed: true }),
    ).toBe(false)
  })

  it('shows after a real drop (was connected before)', () => {
    expect(
      shouldShowReconnectBanner({ connected: false, everConnected: true, graceElapsed: false }),
    ).toBe(true)
  })

  it('shows on a slow first connect once the grace period elapses', () => {
    expect(
      shouldShowReconnectBanner({ connected: false, everConnected: false, graceElapsed: true }),
    ).toBe(true)
  })

  it('stays hidden during the initial grace before any connection', () => {
    expect(
      shouldShowReconnectBanner({ connected: false, everConnected: false, graceElapsed: false }),
    ).toBe(false)
  })
})
