// End-of-event analytics: a recap of how the standings evolved across the
// tournament, derived purely from the played games. Nothing new is tracked —
// every game win is worth one point (POINTS_PER_WIN) and carries its winner on
// `game.winnerTeamId`, so the whole journey is reconstructable from the games in
// play order, the same source the streak award already uses.
import type { Game } from './types'
import { POINTS_PER_WIN } from './constants'
import { leadingTeam } from './logic'

/** The standings snapshot right after one decided game. */
export interface ProgressionStep {
  gameId: string
  order: number
  title: string
  winnerTeamId: string
  totals: Record<string, number>
  leaderId: string | null
}

/** Per-team highlights for the recap. */
export interface TeamRecap {
  teamId: string
  wins: number
  longestStreak: number
  /** The game after which the team first held the lead — its standout moment. */
  keyGame: { gameId: string; title: string } | null
}

export interface TournamentRecap {
  steps: ProgressionStep[]
  gamesPlayed: number
  /** How often the single leader changed hands (ties don't count as a change). */
  leadChanges: number
  /** The largest points gap any team held over the field at any point. */
  biggestLead: { teamId: string; margin: number } | null
  teams: TeamRecap[]
}

/** Cumulative standings after each decided game, in play order. */
export function computeProgression(games: Game[], teamIds: string[]): ProgressionStep[] {
  const ordered = [...games].sort((a, b) => a.order - b.order)
  const totals: Record<string, number> = Object.fromEntries(teamIds.map((id) => [id, 0]))
  const steps: ProgressionStep[] = []
  for (const g of ordered) {
    const winner = g.winnerTeamId
    if (!winner || !(winner in totals)) continue
    totals[winner] = (totals[winner] ?? 0) + POINTS_PER_WIN
    steps.push({
      gameId: g.id,
      order: g.order,
      title: g.title,
      winnerTeamId: winner,
      totals: { ...totals },
      leaderId: leadingTeam(totals),
    })
  }
  return steps
}

function countLeadChanges(steps: ProgressionStep[]): number {
  let changes = 0
  let last: string | null = null
  for (const s of steps) {
    if (s.leaderId && s.leaderId !== last) {
      if (last !== null) changes += 1
      last = s.leaderId
    }
  }
  return changes
}

function biggestLead(
  steps: ProgressionStep[],
  teamIds: string[],
): { teamId: string; margin: number } | null {
  let best: { teamId: string; margin: number } | null = null
  for (const s of steps) {
    const ranked = teamIds
      .map((id) => ({ id, pts: s.totals[id] ?? 0 }))
      .sort((a, b) => b.pts - a.pts)
    const top = ranked[0]
    if (!top) continue
    const margin = top.pts - (ranked[1]?.pts ?? 0)
    if (margin > 0 && (!best || margin > best.margin)) best = { teamId: top.id, margin }
  }
  return best
}

/** Longest run of consecutive wins by one team, in play order. */
function streakOf(teamId: string, orderedGames: Game[]): number {
  let best = 0
  let run = 0
  for (const g of orderedGames) {
    if (g.winnerTeamId === teamId) {
      run += 1
      if (run > best) best = run
    } else {
      run = 0
    }
  }
  return best
}

function teamRecap(teamId: string, orderedGames: Game[], steps: ProgressionStep[]): TeamRecap {
  const wins = orderedGames.filter((g) => g.winnerTeamId === teamId).length
  const lead = steps.find((s) => s.leaderId === teamId)
  return {
    teamId,
    wins,
    longestStreak: streakOf(teamId, orderedGames),
    keyGame: lead ? { gameId: lead.gameId, title: lead.title } : null,
  }
}

/** The full end-of-event recap for a set of teams. */
export function computeRecap(games: Game[], teamIds: string[]): TournamentRecap {
  const ordered = [...games].sort((a, b) => a.order - b.order)
  const steps = computeProgression(ordered, teamIds)
  return {
    steps,
    gamesPlayed: steps.length,
    leadChanges: countLeadChanges(steps),
    biggestLead: biggestLead(steps, teamIds),
    teams: teamIds.map((id) => teamRecap(id, ordered, steps)),
  }
}
