import { getState, upsertPrediction } from '../utils/state'
import { AWARD_BETS } from '../../core/constants'

// Bets are tied to a real player (playerId). Locking rules are enforced here
// (not just in the client): game bets are only allowed on the current game and
// lock once it has a winner; tournament and award bets lock once games start.
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const state = getState()

  const player = state.players.find((p) => p.id === body?.playerId)
  if (!player) throw createError({ statusCode: 400, statusMessage: 'unknown player' })

  const target = String(body?.target ?? '')
  if (!target) throw createError({ statusCode: 400, statusMessage: 'target required' })

  const isTeam = (id: string) => state.teams.some((t) => t.id === id)
  const isPlayer = (id: string) => state.players.some((p) => p.id === id)
  const metaLocked = state.status !== 'setup' && state.status !== 'draw'

  if (body?.scope === 'game') {
    const game = state.games.find((g) => g.id === body?.gameId)
    if (!game) throw createError({ statusCode: 400, statusMessage: 'unknown game' })
    // Only the game the host has actually started is open for betting.
    if (game.id !== state.currentGameId) {
      throw createError({ statusCode: 409, statusMessage: 'game not current' })
    }
    if (game.winnerTeamId) throw createError({ statusCode: 409, statusMessage: 'game locked' })
    if (!isTeam(target)) throw createError({ statusCode: 400, statusMessage: 'unknown team' })
    return upsertPrediction(player.id, 'game', target, { gameId: game.id })
  }

  if (body?.scope === 'tournament') {
    if (metaLocked) throw createError({ statusCode: 409, statusMessage: 'tournament locked' })
    if (!isTeam(target)) throw createError({ statusCode: 400, statusMessage: 'unknown team' })
    return upsertPrediction(player.id, 'tournament', target)
  }

  if (body?.scope === 'award') {
    const bet = AWARD_BETS.find((b) => b.awardId === body?.awardId)
    if (!bet) throw createError({ statusCode: 400, statusMessage: 'unknown award' })
    if (metaLocked) throw createError({ statusCode: 409, statusMessage: 'award locked' })
    const ok = bet.target === 'team' ? isTeam(target) : isPlayer(target)
    if (!ok) throw createError({ statusCode: 400, statusMessage: 'invalid target' })
    return upsertPrediction(player.id, 'award', target, { awardId: bet.awardId })
  }

  throw createError({ statusCode: 400, statusMessage: 'invalid scope' })
})
