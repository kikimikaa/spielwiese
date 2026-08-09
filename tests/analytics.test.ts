import { describe, expect, it } from 'vitest'
import { computeProgression, computeRecap } from '../core/analytics'
import type { Game } from '../core/types'

const game = (id: string, over: Partial<Game> = {}): Game => ({
  id,
  title: id,
  short: '',
  rules: '',
  location: 'both',
  scoringType: 'points',
  order: 0,
  status: 'done',
  ...over,
})

// A → B → A takes the lead back: two teams, three decided games.
const teamIds = ['a', 'b']
const won = (id: string, order: number, teamId: string) => game(id, { order, winnerTeamId: teamId })

describe('computeProgression', () => {
  it('accumulates cumulative totals in play order', () => {
    const games = [won('g1', 0, 'a'), won('g2', 1, 'b'), won('g3', 2, 'a')]
    const steps = computeProgression(games, teamIds)
    expect(steps.map((s) => s.totals)).toEqual([
      { a: 1, b: 0 },
      { a: 1, b: 1 },
      { a: 2, b: 1 },
    ])
    expect(steps.map((s) => s.leaderId)).toEqual(['a', null, 'a'])
  })

  it('respects order regardless of array order', () => {
    const games = [won('g3', 2, 'a'), won('g1', 0, 'a'), won('g2', 1, 'b')]
    const steps = computeProgression(games, teamIds)
    expect(steps.map((s) => s.gameId)).toEqual(['g1', 'g2', 'g3'])
  })

  it('skips undecided games and wins by unknown teams', () => {
    const games = [
      won('g1', 0, 'a'),
      game('g2', { order: 1, winnerTeamId: null }),
      won('g3', 2, 'ghost'),
      won('g4', 3, 'b'),
    ]
    const steps = computeProgression(games, teamIds)
    expect(steps.map((s) => s.gameId)).toEqual(['g1', 'g4'])
    expect(steps.at(-1)?.totals).toEqual({ a: 1, b: 1 })
  })

  it('returns no steps when nothing was decided', () => {
    expect(computeProgression([game('g1', { winnerTeamId: null })], teamIds)).toEqual([])
    expect(computeProgression([], teamIds)).toEqual([])
  })
})

describe('computeRecap', () => {
  it('summarises games played, lead changes and biggest lead', () => {
    // a leads, b ties then overtakes, a takes it back and pulls ahead.
    const games = [
      won('g1', 0, 'a'), // a1 b0  leader a
      won('g2', 1, 'b'), // a1 b1  tie
      won('g3', 2, 'b'), // a1 b2  leader b   (change 1)
      won('g4', 3, 'a'), // a2 b2  tie
      won('g5', 4, 'a'), // a3 b2  leader a   (change 2)
    ]
    const recap = computeRecap(games, teamIds)
    expect(recap.gamesPlayed).toBe(5)
    expect(recap.leadChanges).toBe(2)
    expect(recap.biggestLead).toEqual({ teamId: 'a', margin: 1 })
  })

  it('records per-team wins, longest streak and key game', () => {
    const games = [won('g1', 0, 'b'), won('g2', 1, 'a'), won('g3', 2, 'a'), won('g4', 3, 'a')]
    const recap = computeRecap(games, teamIds)
    const a = recap.teams.find((t) => t.teamId === 'a')
    const b = recap.teams.find((t) => t.teamId === 'b')
    expect(a).toMatchObject({ wins: 3, longestStreak: 3, keyGame: { gameId: 'g3' } })
    // b won the opener but a overtook and never gave the lead back.
    expect(b).toMatchObject({ wins: 1, longestStreak: 1, keyGame: { gameId: 'g1' } })
  })

  it('a transient lead that ends level counts no lead change', () => {
    // a edges ahead after g1, b levels it after g2 — never overtakes.
    const games = [won('g1', 0, 'a'), won('g2', 1, 'b')]
    const recap = computeRecap(games, teamIds)
    expect(recap.steps.at(-1)?.totals).toEqual({ a: 1, b: 1 })
    expect(recap.leadChanges).toBe(0)
    expect(recap.biggestLead).toEqual({ teamId: 'a', margin: 1 })
    expect(recap.teams.find((t) => t.teamId === 'a')?.keyGame).toEqual({
      gameId: 'g1',
      title: 'g1',
    })
    expect(recap.teams.find((t) => t.teamId === 'b')?.keyGame).toBeNull()
  })

  it('a single dominant team never changes the lead', () => {
    const games = [won('g1', 0, 'a'), won('g2', 1, 'a')]
    const recap = computeRecap(games, teamIds)
    expect(recap.leadChanges).toBe(0)
    expect(recap.biggestLead).toEqual({ teamId: 'a', margin: 2 })
    expect(recap.teams.find((t) => t.teamId === 'b')).toMatchObject({
      wins: 0,
      longestStreak: 0,
      keyGame: null,
    })
  })

  it('handles an empty tournament', () => {
    const recap = computeRecap([], teamIds)
    expect(recap).toMatchObject({ gamesPlayed: 0, leadChanges: 0, biggestLead: null })
    expect(recap.teams).toHaveLength(2)
    expect(recap.teams.every((t) => t.wins === 0 && t.keyGame === null)).toBe(true)
  })
})
