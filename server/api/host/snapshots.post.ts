import { assertHostPin } from '../../utils/auth'
import * as store from '../../utils/state'
import * as snaps from '../../utils/snapshots'

interface SnapshotBody {
  pin?: unknown
  action?: unknown
  name?: unknown
  id?: unknown
}

/** A load/delete needs a concrete id; a missing or non-string one is a bad request. */
function requireId(raw: unknown): string {
  const id = typeof raw === 'string' ? raw.trim() : ''
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing snapshot id' })
  return id
}

/**
 * PIN-gated save/resume endpoint. Kept separate from the command bus because it
 * returns the snapshot list (host-only metadata), not the tournament state — a
 * `load` still broadcasts the restored state over WebSocket like any mutation.
 */
export default defineEventHandler(async (event) => {
  const body = ((await readBody(event)) ?? {}) as SnapshotBody
  assertHostPin(body.pin)

  const action = typeof body.action === 'string' ? body.action : ''
  switch (action) {
    case 'list':
      return { snapshots: snaps.listSnapshots() }
    case 'save': {
      const name = typeof body.name === 'string' ? body.name : ''
      return { snapshots: await snaps.saveSnapshot(name, store.getState(), Date.now()) }
    }
    case 'delete':
      return { snapshots: await snaps.deleteSnapshot(requireId(body.id)) }
    case 'load': {
      const state = snaps.snapshotState(requireId(body.id))
      if (state) store.replaceState(state)
      return { snapshots: snaps.listSnapshots() }
    }
    default:
      throw createError({ statusCode: 400, statusMessage: `Unknown snapshot action: ${action}` })
  }
})
