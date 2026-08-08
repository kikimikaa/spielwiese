import { assertHostPin } from '../../utils/auth'
import * as store from '../../utils/state'
import * as snaps from '../../utils/snapshots'

/**
 * PIN-gated save/resume endpoint. Kept separate from the command bus because it
 * returns the snapshot list (host-only metadata), not the tournament state — a
 * `load` still broadcasts the restored state over WebSocket like any mutation.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  assertHostPin(body?.pin)

  const action = body?.action as string
  switch (action) {
    case 'list':
      return { snapshots: snaps.listSnapshots() }
    case 'save':
      return {
        snapshots: snaps.saveSnapshot(String(body?.name ?? ''), store.getState(), Date.now()),
      }
    case 'delete':
      return { snapshots: snaps.deleteSnapshot(String(body?.id ?? '')) }
    case 'load': {
      const state = snaps.snapshotState(String(body?.id ?? ''))
      if (state) store.replaceState(state)
      return { snapshots: snaps.listSnapshots() }
    }
    default:
      throw createError({ statusCode: 400, statusMessage: `Unknown snapshot action: ${action}` })
  }
})
