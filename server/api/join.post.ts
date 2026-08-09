import { claimPlayer, getState } from '../utils/state'
import { clampText, findPlayerByName, validateDisplayName } from '../../core/logic'
import { MAX_NAME_LENGTH } from '../../core/constants'

// A guest types their real name (matched case-insensitively against the players
// the host created) and a display name. No list is exposed, so you can't grab
// someone else's identity from a dropdown. The display name must be unique and
// must not impersonate a real name. Errors carry a machine-readable `reason`.
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const state = getState()

  const player = findPlayerByName(state.players, String(body?.name ?? ''))
  if (!player) {
    throw createError({
      statusCode: 404,
      statusMessage: 'name not found',
      data: { reason: 'nameNotFound' },
    })
  }

  const displayName = clampText(body?.displayName, MAX_NAME_LENGTH)
  const problem = validateDisplayName(displayName, state.players, player.id)
  if (problem) {
    const reason =
      problem === 'empty'
        ? 'displayEmpty'
        : problem === 'isRealName'
          ? 'displayIsRealName'
          : 'displayTaken'
    throw createError({ statusCode: 409, statusMessage: reason, data: { reason } })
  }

  claimPlayer(player.id, displayName)
  return { playerId: player.id, displayName }
})
