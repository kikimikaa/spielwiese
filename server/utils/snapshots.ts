import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import type { TournamentState } from '../../core/types'
import type { SnapshotMeta } from '../../core/snapshots'
import { snapshotName, summarizeState } from '../../core/snapshots'
import { SNAPSHOT_FILE } from '../../core/constants'
import { isValidState } from './state'
import { createJsonWriter } from './persist'

/** A saved snapshot keeps the full state; only its metadata is ever sent to the client. */
interface StoredSnapshot {
  id: string
  name: string
  savedAt: number
  state: TournamentState
}

const SNAPSHOT_PATH = resolve(process.cwd(), SNAPSHOT_FILE)

/** A record is only usable if its state is well-formed — else summarizing it later throws. */
function isStored(x: unknown): x is StoredSnapshot {
  const s = x as Partial<StoredSnapshot> | null
  return Boolean(
    s &&
    typeof s.id === 'string' &&
    typeof s.name === 'string' &&
    typeof s.savedAt === 'number' &&
    isValidState(s.state),
  )
}

function load(): StoredSnapshot[] {
  if (existsSync(SNAPSHOT_PATH)) {
    try {
      const parsed = JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf8')) as unknown
      // Drop any malformed record so one bad entry can't crash the whole panel.
      if (Array.isArray(parsed)) return parsed.filter(isStored)
    } catch {
      // Corrupt file — start with no snapshots rather than crash the app.
    }
  }
  return []
}

let snapshots: StoredSnapshot[] = load()

const persist = createJsonWriter(SNAPSHOT_PATH, () => snapshots)

function toMeta(s: StoredSnapshot): SnapshotMeta {
  return { id: s.id, name: s.name, savedAt: s.savedAt, summary: summarizeState(s.state) }
}

/** Metadata for every snapshot, newest first (never ships the stored state). */
export function listSnapshots(): SnapshotMeta[] {
  return [...snapshots].sort((a, b) => b.savedAt - a.savedAt).map(toMeta)
}

/**
 * Stores a deep copy of the current state so later play can't mutate the
 * snapshot. Awaits the write so a failed save surfaces as an error, not a silent
 * 200 with lost data.
 */
export async function saveSnapshot(
  name: string,
  state: TournamentState,
  now: number,
): Promise<SnapshotMeta[]> {
  snapshots.push({
    id: randomUUID(),
    name: snapshotName(name, state.name),
    savedAt: now,
    state: structuredClone(state),
  })
  await persist()
  return listSnapshots()
}

export async function deleteSnapshot(id: string): Promise<SnapshotMeta[]> {
  snapshots = snapshots.filter((s) => s.id !== id)
  await persist()
  return listSnapshots()
}

/** A deep copy of a snapshot's state to load into the live tournament, or null. */
export function snapshotState(id: string): TournamentState | null {
  const s = snapshots.find((x) => x.id === id)
  return s ? structuredClone(s.state) : null
}
