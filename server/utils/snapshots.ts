import { existsSync, readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import type { TournamentState } from '../../core/types'
import type { SnapshotMeta } from '../../core/snapshots'
import { snapshotName, summarizeState } from '../../core/snapshots'
import { SNAPSHOT_FILE } from '../../core/constants'

/** A saved snapshot keeps the full state; only its metadata is ever sent to the client. */
interface StoredSnapshot {
  id: string
  name: string
  savedAt: number
  state: TournamentState
}

const SNAPSHOT_PATH = resolve(process.cwd(), SNAPSHOT_FILE)

function load(): StoredSnapshot[] {
  if (existsSync(SNAPSHOT_PATH)) {
    try {
      const parsed = JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf8')) as unknown
      if (Array.isArray(parsed)) return parsed as StoredSnapshot[]
    } catch {
      // Corrupt file — start with no snapshots rather than crash the app.
    }
  }
  return []
}

let snapshots: StoredSnapshot[] = load()

let dirEnsured = false
async function persist(): Promise<void> {
  if (!dirEnsured) {
    await mkdir(dirname(SNAPSHOT_PATH), { recursive: true })
    dirEnsured = true
  }
  await writeFile(SNAPSHOT_PATH, JSON.stringify(snapshots, null, 2), 'utf8')
}

function toMeta(s: StoredSnapshot): SnapshotMeta {
  return { id: s.id, name: s.name, savedAt: s.savedAt, summary: summarizeState(s.state) }
}

/** Metadata for every snapshot, newest first (never ships the stored state). */
export function listSnapshots(): SnapshotMeta[] {
  return [...snapshots].sort((a, b) => b.savedAt - a.savedAt).map(toMeta)
}

/** Stores a deep copy of the current state so later play can't mutate the snapshot. */
export function saveSnapshot(name: string, state: TournamentState, now: number): SnapshotMeta[] {
  snapshots.push({
    id: randomUUID(),
    name: snapshotName(name, state.name),
    savedAt: now,
    state: structuredClone(state),
  })
  void persist()
  return listSnapshots()
}

export function deleteSnapshot(id: string): SnapshotMeta[] {
  snapshots = snapshots.filter((s) => s.id !== id)
  void persist()
  return listSnapshots()
}

/** A deep copy of a snapshot's state to load into the live tournament, or null. */
export function snapshotState(id: string): TournamentState | null {
  const s = snapshots.find((x) => x.id === id)
  return s ? structuredClone(s.state) : null
}
