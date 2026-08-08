import { describe, expect, it } from 'vitest'
import { snapshotName, summarizeState } from '../core/snapshots'
import type { TournamentState } from '../core/types'

const state = (over: Partial<TournamentState> = {}): TournamentState =>
  ({
    name: 'Sommerfest',
    date: '2026-09-19',
    status: 'running',
    pause: 'none',
    roster: [],
    teams: [{ id: 't1' }, { id: 't2' }],
    players: [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }],
    games: [{ id: 'g1' }, { id: 'g2' }],
    currentGameId: null,
    scoreEvents: [],
    predictions: [],
    revealedAwards: [],
    quiz: { index: 0, revealed: false },
    ...over,
  }) as TournamentState

describe('snapshotName', () => {
  it('uses the trimmed entered name when present', () => {
    expect(snapshotName('  Finale  ', 'Sommerfest')).toBe('Finale')
  })

  it('falls back to the tournament name when the entry is blank', () => {
    expect(snapshotName('   ', 'Sommerfest')).toBe('Sommerfest')
  })

  it('falls back to a constant when both are blank', () => {
    expect(snapshotName('', '   ')).toBe('Snapshot')
  })
})

describe('summarizeState', () => {
  it('counts games, teams and players and carries the status', () => {
    expect(summarizeState(state())).toEqual({
      games: 2,
      teams: 2,
      players: 3,
      status: 'running',
    })
  })

  it('handles an empty tournament', () => {
    expect(summarizeState(state({ teams: [], players: [], games: [], status: 'setup' }))).toEqual({
      games: 0,
      teams: 0,
      players: 0,
      status: 'setup',
    })
  })
})
