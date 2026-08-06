import type { TournamentState } from '../core/types'

/**
 * Host session: keeps the PIN (in localStorage via useCookie) and exposes a
 * typed command sender that talks to the PIN-gated command endpoint.
 */
export function useHost() {
  const pin = useCookie<string>('spielwiese-host-pin', { default: () => '', sameSite: 'lax' })
  const unlocked = useState<boolean>('host-unlocked', () => false)
  const error = useState<string | null>('host-error', () => null)
  const tournamentState = useState<TournamentState | null>('tournament-state')

  async function send(candidate: string, command: string, payload: Record<string, unknown> = {}) {
    error.value = null
    try {
      const next = await $fetch<TournamentState>('/api/host/command', {
        method: 'POST',
        body: { pin: candidate, command, payload },
      })
      // Apply the result immediately so the host UI updates even if the live
      // WebSocket push is delayed or momentarily disconnected.
      tournamentState.value = next
      return next
    } catch (e: unknown) {
      const status = (e as { statusCode?: number }).statusCode
      if (status === 401) {
        unlocked.value = false
        error.value = 'wrongPin'
      }
      throw e
    }
  }

  function command(command: string, payload: Record<string, unknown> = {}) {
    return send(pin.value, command, payload)
  }

  /**
   * Verifies the PIN with a side-effect-free `ping` BEFORE persisting it, so a
   * wrong guess never clobbers a stored valid PIN and unlocking never disturbs a
   * running tournament (e.g. lifting the pre-ceremony suspense pause).
   */
  async function unlock(candidate: string) {
    await send(candidate, 'ping')
    pin.value = candidate
    unlocked.value = true
  }

  return { pin, unlocked, error, command, unlock }
}
