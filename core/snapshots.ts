// Save / resume: a snapshot is a full copy of the live tournament state kept so
// an event can be paused and reloaded later. This module holds the pure, shared
// shapes and helpers; the server owns the storage and the cloning.
import type { TournamentState, TournamentStatus } from './types'

/** Counts that let the host recognise a snapshot in the list without loading it. */
export interface SnapshotSummary {
  games: number
  teams: number
  players: number
  status: TournamentStatus
}

/** What the host sees per saved snapshot — never the full stored state. */
export interface SnapshotMeta {
  id: string
  name: string
  /** Epoch milliseconds the snapshot was taken. */
  savedAt: number
  summary: SnapshotSummary
}

/** Final fallback when neither the entered name nor the tournament name is usable. */
const FALLBACK_NAME = 'Snapshot'

/** Trimmed snapshot name, falling back to the tournament name, then a constant. */
export function snapshotName(raw: string, tournamentName: string): string {
  return raw.trim() || tournamentName.trim() || FALLBACK_NAME
}

/** Derives the display counts for a snapshot from its state. */
export function summarizeState(state: TournamentState): SnapshotSummary {
  return {
    games: state.games.length,
    teams: state.teams.length,
    players: state.players.length,
    status: state.status,
  }
}
