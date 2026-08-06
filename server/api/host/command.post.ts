import type { AwardId, PauseMode, TournamentStatus } from '../../../core/types'
import { AWARD_IDS } from '../../../core/constants'
import { assertHostPin } from '../../utils/auth'
import * as store from '../../utils/state'

const STATUSES: TournamentStatus[] = ['setup', 'draw', 'running', 'awards', 'finished']
const PAUSE_MODES: PauseMode[] = ['none', 'break', 'suspense']

/**
 * Single PIN-gated command endpoint for all host mutations. A command bus keeps
 * the surface tiny for a one-evening local app; each command maps 1:1 to a
 * store mutation and returns the new state (also broadcast via WebSocket).
 */
/** Coerces to a finite number or rejects the request — never stores NaN. */
function num(value: unknown): number {
  const n = Number(value)
  if (!Number.isFinite(n)) throw createError({ statusCode: 400, statusMessage: 'invalid number' })
  return n
}

/** Rejects a value that isn't one of the allowed enum members. */
function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw createError({ statusCode: 400, statusMessage: 'invalid value' })
  }
  return value as T
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  assertHostPin(body?.pin)

  const command = body?.command as string
  const p = body?.payload ?? {}

  switch (command) {
    case 'ping':
      // PIN already verified above; no state change (used to unlock the host).
      return store.getState()
    case 'setStatus':
      return store.setStatus(oneOf(p.status, STATUSES))
    case 'setPause':
      return store.setPause(oneOf(p.mode, PAUSE_MODES))
    case 'revealAward':
      return store.toggleAwardReveal(oneOf(p.awardId, AWARD_IDS))
    case 'revealAllAwards':
      return store.setRevealedAwards(
        (Array.isArray(p.awardIds) ? p.awardIds : []).filter((id: unknown): id is AwardId =>
          AWARD_IDS.includes(id as AwardId),
        ),
      )
    case 'hideAllAwards':
      return store.setRevealedAwards([])
    case 'renameTeam':
      return store.renameTeam(p.teamId, p.name)
    case 'addGame':
      return store.addGame(p.game ?? {})
    case 'updateGame':
      return store.updateGame(p.gameId, p.patch ?? {})
    case 'removeGame':
      return store.removeGame(p.gameId)
    case 'reorderGames':
      return store.reorderGames(p.orderedIds ?? [])
    case 'loadExampleGames':
      return store.loadExampleGames()
    case 'clearGames':
      return store.clearGames()
    case 'draw':
      return store.drawTournamentTeams(p.names ?? [])
    case 'setTeams':
      return store.setTeams(p.assignment ?? [])
    case 'setCurrentGame':
      return store.setCurrentGame(p.gameId ?? null)
    case 'undoScore':
      return store.undoLastScore(p.gameId)
    case 'awardWin':
      return store.awardGameWin(p.gameId, p.teamId)
    case 'setMetric':
      return store.setGameMetric(p.gameId, p.teamId, num(p.value))
    case 'softReset':
      return store.softReset()
    case 'reset':
      return store.resetTournament()
    default:
      throw createError({ statusCode: 400, statusMessage: `Unknown command: ${command}` })
  }
})
