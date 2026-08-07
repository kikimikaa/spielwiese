import type { Award, AwardId, Game, Player, Prediction, ScoreEvent } from './types'
import {
  MIN_BETS_FOR_GUEST_AWARD,
  MIN_STREAK_FOR_AWARD,
  PREDICTION_AWARD_POINTS,
  PREDICTION_GAME_POINTS,
  PREDICTION_TOURNAMENT_POINTS,
} from './constants'

/** Case-insensitive, trimmed name key for matching real/display names. */
export function normalizeName(name: string): string {
  return name.trim().toLowerCase()
}

/**
 * Clamps an index into `[0, length - 1]`, or 0 when the list is empty. Keeps the
 * quiz question pointer valid however the host navigates or edits the questions.
 */
export function clampIndex(index: number, length: number): number {
  if (length <= 0) return 0
  return Math.min(Math.max(0, Math.trunc(index)), length - 1)
}

/**
 * The single newly-appeared win id worth celebrating, or null. Returns an id only
 * when exactly one current id is unseen — so an undo (nothing new), a reconnect
 * catch-up (several new at once) and the initial load (caller seeds `seen` first)
 * stay silent, while a live win or a re-award (one fresh id) fires once.
 */
export function freshWinId(seen: Set<string>, currentIds: string[]): string | null {
  const fresh = currentIds.filter((id) => !seen.has(id))
  return fresh.length === 1 ? (fresh[0] ?? null) : null
}

/** Finds a host-created player by real name, ignoring case and surrounding space. */
export function findPlayerByName(players: Player[], name: string): Player | null {
  const key = normalizeName(name)
  if (!key) return null
  return players.find((p) => normalizeName(p.name) === key) ?? null
}

export type DisplayNameError = 'empty' | 'isRealName' | 'taken' | null

/**
 * A display name must be non-empty, must not collide with any real player name
 * (no impersonation) and must not already be another player's display name.
 */
export function validateDisplayName(
  displayName: string,
  players: Player[],
  selfId: string,
): DisplayNameError {
  const key = normalizeName(displayName)
  if (!key) return 'empty'
  if (players.some((p) => normalizeName(p.name) === key)) return 'isRealName'
  if (
    players.some((p) => p.id !== selfId && p.displayName && normalizeName(p.displayName) === key)
  ) {
    return 'taken'
  }
  return null
}

/**
 * Picks the most likely home-LAN IPv4 from a list of candidates: prefers
 * 192.168.x, then 10.x, then 172.x, ignoring link-local (169.254.x). Keeps the
 * startup banner from printing a virtual-adapter address instead of the real one.
 */
export function pickLanIp(candidates: string[]): string | null {
  const usable = candidates.filter((ip) => !ip.startsWith('169.254.'))
  const rank = (ip: string) =>
    ip.startsWith('192.168.') ? 0 : ip.startsWith('10.') ? 1 : ip.startsWith('172.') ? 2 : 3
  return [...usable].sort((a, b) => rank(a) - rank(b))[0] ?? null
}

/**
 * The single leading team by points, or null if it's a tie or nobody scored.
 * A tie deliberately has no leader/champion.
 */
export function leadingTeam(totals: Record<string, number>): string | null {
  let bestId: string | null = null
  let bestPts = 0
  let tied = false
  for (const [id, pts] of Object.entries(totals)) {
    if (bestId === null || pts > bestPts) {
      bestId = id
      bestPts = pts
      tied = false
    } else if (pts === bestPts) {
      tied = true
    }
  }
  return bestId && bestPts > 0 && !tied ? bestId : null
}

/** Total points per team from the event log. */
export function computeTotals(events: ScoreEvent[], teamIds: string[]): Record<string, number> {
  const totals: Record<string, number> = Object.fromEntries(teamIds.map((id) => [id, 0]))
  for (const e of events) {
    if (e.teamId in totals) totals[e.teamId] = (totals[e.teamId] ?? 0) + e.delta
  }
  return totals
}

/** Fisher–Yates shuffle with an injectable random source (for tests). */
export function shuffle<T>(items: T[], rng: () => number = Math.random): T[] {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = out[i] as T
    out[i] = out[j] as T
    out[j] = tmp
  }
  return out
}

/**
 * Distributes names as evenly as possible across the teams (round-robin after a
 * shuffle). Returns the name → teamId assignment; empty names are ignored.
 */
export function drawTeams(
  names: string[],
  teamIds: string[],
  rng: () => number = Math.random,
): { name: string; teamId: string }[] {
  const clean = names.map((n) => n.trim()).filter((n) => n.length > 0)
  if (teamIds.length === 0) return []
  return shuffle(clean, rng).map((name, i) => ({
    name,
    teamId: teamIds[i % teamIds.length] as string,
  }))
}

export interface PredictionScore {
  playerId: string
  points: number
  correctGames: number
  correctTournament: boolean
  correctAwards: number
}

function ensureScore(map: Map<string, PredictionScore>, playerId: string): PredictionScore {
  let s = map.get(playerId)
  if (!s) {
    s = { playerId, points: 0, correctGames: 0, correctTournament: false, correctAwards: 0 }
    map.set(playerId, s)
  }
  return s
}

/** Base points from game + tournament bets (award bets are scored separately). */
function baseScores(
  predictions: Prediction[],
  games: Game[],
  tournamentWinnerTeamId: string | null,
): Map<string, PredictionScore> {
  const winnerByGame = new Map(games.map((g) => [g.id, g.winnerTeamId ?? null]))
  const byPlayer = new Map<string, PredictionScore>()
  for (const p of predictions) {
    // Everyone who placed any bet appears on the leaderboard (0 if none right).
    const s = ensureScore(byPlayer, p.playerId)
    if (p.scope === 'game' && p.gameId) {
      if (winnerByGame.get(p.gameId) === p.target) {
        s.points += PREDICTION_GAME_POINTS
        s.correctGames += 1
      }
    } else if (p.scope === 'tournament') {
      if (tournamentWinnerTeamId && tournamentWinnerTeamId === p.target) {
        s.points += PREDICTION_TOURNAMENT_POINTS
        s.correctTournament = true
      }
    }
  }
  return byPlayer
}

/** Winner id (team or player) per award, taken from the computed awards. */
export function awardWinners(awards: Award[]): Partial<Record<AwardId, string>> {
  const map: Partial<Record<AwardId, string>> = {}
  for (const a of awards) {
    const id = a.teamId ?? a.playerId
    if (id) map[a.id] = id
  }
  return map
}

/**
 * Full leaderboard: base game/tournament points plus award-bet points. Pass the
 * final `awards` only when they should count (e.g. tournament finished);
 * otherwise pass [] so pending award bets don't score yet.
 */
export function scorePredictions(
  predictions: Prediction[],
  games: Game[],
  tournamentWinnerTeamId: string | null,
  awards: Award[] = [],
): PredictionScore[] {
  const byPlayer = baseScores(predictions, games, tournamentWinnerTeamId)
  const winners = awardWinners(awards)
  for (const p of predictions) {
    if (p.scope === 'award' && p.awardId && winners[p.awardId] === p.target) {
      const s = ensureScore(byPlayer, p.playerId)
      s.points += PREDICTION_AWARD_POINTS
      s.correctAwards += 1
    }
  }
  return [...byPlayer.values()].sort(
    (a, b) => b.points - a.points || a.playerId.localeCompare(b.playerId),
  )
}

/** Longest run of consecutive game wins by one team, in play order. */
export function longestWinStreak(games: Game[]): { teamId: string; length: number } | null {
  const ordered = [...games].sort((a, b) => a.order - b.order)
  let best: { teamId: string; length: number } | null = null
  let runTeam: string | null = null
  let runLength = 0
  for (const g of ordered) {
    const winner = g.winnerTeamId
    if (!winner) {
      runTeam = null
      runLength = 0
      continue
    }
    runLength = winner === runTeam ? runLength + 1 : 1
    runTeam = winner
    if (!best || runLength > best.length) best = { teamId: winner, length: runLength }
  }
  return best
}

/** Counts items by a derived key. */
function countBy<T>(items: T[], key: (item: T) => string): Map<string, number> {
  const counts = new Map<string, number>()
  for (const item of items) {
    const k = key(item)
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  return counts
}

/**
 * "Honorable mentions" shown before the winner ceremony. Only awards with a
 * clear winner are returned (e.g. no time award if nothing was measured, no
 * guest awards below the minimum bet count). None of them re-rank teams by
 * points — that is just the tournament winner.
 */
export function computeAwards(
  games: Game[],
  predictions: Prediction[],
  tournamentWinnerTeamId: string | null,
): Award[] {
  const awards: Award[] = []

  // Fastest / slowest (sum of time metrics across measured games where lower
  // is better — i.e. real race times, not just any seconds-valued metric).
  const timeGames = games.filter(
    (g) => g.tracksMetric && g.metricUnit === 's' && g.metricLowerIsBetter && g.metricByTeam,
  )
  const timeByTeam: Record<string, number> = {}
  for (const g of timeGames) {
    for (const [teamId, v] of Object.entries(g.metricByTeam ?? {})) {
      timeByTeam[teamId] = (timeByTeam[teamId] ?? 0) + v
    }
  }
  const fastest = minEntry(timeByTeam)
  const slowest = maxEntry(timeByTeam)
  if (fastest) awards.push({ id: 'fastest', teamId: fastest.key, value: fastest.value })
  if (slowest && slowest.key !== fastest?.key) {
    awards.push({ id: 'slowest', teamId: slowest.key, value: slowest.value })
  }

  // Winning streak — rewards momentum, meaningful even with only two teams.
  const streak = longestWinStreak(games)
  if (streak && streak.length >= MIN_STREAK_FOR_AWARD) {
    awards.push({ id: 'streak', teamId: streak.teamId, value: streak.length })
  }

  // Prediction king — ranked on base game/tournament points (award bets excluded
  // so an award can't score itself).
  const [top] = scorePredictions(predictions, games, tournamentWinnerTeamId)
  if (top && top.points > 0) {
    awards.push({ id: 'tipp-koenig', playerId: top.playerId, value: top.points })
  }

  // Guest fun awards: most bets placed ("daredevil") and most wrong ("unlucky").
  // Correctness now counts award bets too, since every award above is known.
  const betsPlaced = countBy(predictions, (p) => p.playerId)
  const board = scorePredictions(predictions, games, tournamentWinnerTeamId, awards)
  let daredevil: { playerId: string; value: number } | null = null
  let unlucky: { playerId: string; value: number } | null = null
  for (const s of board) {
    const total = betsPlaced.get(s.playerId) ?? 0
    if (total < MIN_BETS_FOR_GUEST_AWARD) continue
    if (!daredevil || total > daredevil.value) daredevil = { playerId: s.playerId, value: total }
    const correct = s.correctGames + (s.correctTournament ? 1 : 0) + s.correctAwards
    const wrong = total - correct
    if (wrong > 0 && (!unlucky || wrong > unlucky.value)) {
      unlucky = { playerId: s.playerId, value: wrong }
    }
  }
  if (daredevil)
    awards.push({ id: 'draufgaenger', playerId: daredevil.playerId, value: daredevil.value })
  if (unlucky) awards.push({ id: 'pechvogel', playerId: unlucky.playerId, value: unlucky.value })

  return awards
}

function maxEntry(rec: Record<string, number>): { key: string; value: number } | null {
  return reduceEntry(rec, (a, b) => b > a)
}
function minEntry(rec: Record<string, number>): { key: string; value: number } | null {
  return reduceEntry(rec, (a, b) => b < a)
}
function reduceEntry(
  rec: Record<string, number>,
  better: (current: number, candidate: number) => boolean,
): { key: string; value: number } | null {
  let best: { key: string; value: number } | null = null
  for (const [key, value] of Object.entries(rec)) {
    if (!best || better(best.value, value)) best = { key, value }
  }
  return best
}
