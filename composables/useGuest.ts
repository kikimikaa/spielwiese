import type { AwardId, PredictionScope, TournamentState } from '../core/types'

/**
 * Guest session: the guest types their real name (matched by the server against
 * the host's players) and picks a public display name. Both are persisted on the
 * device; all predictions are then tied to the resolved player id.
 */
export function useGuest() {
  const playerId = useCookie<string>('spielwiese-player', { default: () => '', sameSite: 'lax' })
  const displayName = useCookie<string>('spielwiese-display', {
    default: () => '',
    sameSite: 'lax',
  })
  const tournamentState = useState<TournamentState | null>('tournament-state')

  async function join(realName: string, chosenDisplayName: string) {
    const res = await $fetch<{ playerId: string; displayName: string }>('/api/join', {
      method: 'POST',
      body: { name: realName, displayName: chosenDisplayName },
    })
    playerId.value = res.playerId
    displayName.value = res.displayName
    return res
  }

  async function predict(
    scope: PredictionScope,
    target: string,
    refs: { gameId?: string; awardId?: AwardId } = {},
  ) {
    if (!playerId.value) return
    const next = await $fetch<TournamentState>('/api/predict', {
      method: 'POST',
      body: { playerId: playerId.value, scope, target, gameId: refs.gameId, awardId: refs.awardId },
    })
    tournamentState.value = next
    return next
  }

  function leave() {
    playerId.value = ''
    displayName.value = ''
  }

  return { playerId, displayName, join, predict, leave }
}
