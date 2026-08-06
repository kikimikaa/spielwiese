import { existsSync, readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import type {
  AwardId,
  Game,
  GameDef,
  PauseMode,
  Player,
  PredictionScope,
  TournamentState,
  TournamentStatus,
} from '../../core/types'
import { EXAMPLE_GAMES } from '../../core/example-games'
import {
  DEFAULT_TEAMS,
  POINTS_PER_WIN,
  STATE_FILE,
  TOURNAMENT_DATE,
  TOURNAMENT_DEFAULT_NAME,
} from '../../core/constants'
import { drawTeams } from '../../core/logic'

const STATE_PATH = resolve(process.cwd(), STATE_FILE)

/** Turns a game definition into a fresh runtime game at the given position. */
function toGame(def: GameDef, order: number): Game {
  return { ...def, order, status: 'todo' }
}

function createInitialState(): TournamentState {
  const teams = DEFAULT_TEAMS.map((t) => ({
    id: randomUUID(),
    name: t.name,
    color: t.color,
    playerIds: [] as string[],
  }))
  return {
    name: TOURNAMENT_DEFAULT_NAME,
    date: TOURNAMENT_DATE,
    status: 'setup',
    pause: 'none',
    roster: [],
    teams,
    players: [],
    games: EXAMPLE_GAMES.map(toGame),
    currentGameId: null,
    scoreEvents: [],
    predictions: [],
    revealedAwards: [],
  }
}

/** Minimal shape check so a schema-drifted/partial file can't crash the app. */
function isValidState(x: unknown): x is TournamentState {
  const s = x as Partial<TournamentState> | null
  return Boolean(
    s &&
    Array.isArray(s.teams) &&
    Array.isArray(s.games) &&
    Array.isArray(s.players) &&
    Array.isArray(s.scoreEvents) &&
    Array.isArray(s.predictions),
  )
}

function load(): TournamentState {
  if (existsSync(STATE_PATH)) {
    try {
      const parsed = JSON.parse(readFileSync(STATE_PATH, 'utf8')) as unknown
      if (isValidState(parsed)) {
        // Backfill fields added in later versions so older files still work.
        parsed.roster ??= []
        parsed.pause ??= 'none'
        parsed.status ??= 'setup'
        parsed.revealedAwards ??= []
        return parsed
      }
    } catch {
      // Don't let a corrupt file block the event — start fresh instead.
    }
  }
  return createInitialState()
}

let state: TournamentState = load()

const subscribers = new Set<(s: TournamentState) => void>()

export function subscribe(fn: (s: TournamentState) => void): () => void {
  subscribers.add(fn)
  return () => subscribers.delete(fn)
}

export function getState(): TournamentState {
  return state
}

let dirEnsured = false
let writing = false
let writeAgain = false

/**
 * Async, coalesced persistence: bursts of mutations collapse into a single
 * pending write instead of blocking the event loop with a sync write each time.
 * The directory is created only once.
 */
async function persist(): Promise<void> {
  writeAgain = true
  if (writing) return
  writing = true
  try {
    if (!dirEnsured) {
      await mkdir(dirname(STATE_PATH), { recursive: true })
      dirEnsured = true
    }
    while (writeAgain) {
      writeAgain = false
      await writeFile(STATE_PATH, JSON.stringify(state, null, 2), 'utf8')
    }
  } finally {
    writing = false
  }
}

/** Persists the state (async) and notifies every connected board immediately. */
function commit(): TournamentState {
  void persist()
  for (const fn of subscribers) fn(state)
  return state
}

function teamIds(): string[] {
  return state.teams.map((t) => t.id)
}

function findGame(gameId: string): Game | undefined {
  return state.games.find((g) => g.id === gameId)
}

function reindexGames(): void {
  state.games.forEach((g, i) => {
    g.order = i
  })
}

export function setStatus(status: TournamentStatus): TournamentState {
  state.status = status
  // Entering the awards/ceremony always lifts any pause so the board reveals it.
  if (status === 'awards' || status === 'finished') state.pause = 'none'
  return commit()
}

export function setPause(mode: PauseMode): TournamentState {
  state.pause = mode
  return commit()
}

/** Reveals or re-hides a single honorable mention on the board (host-driven). */
export function toggleAwardReveal(awardId: AwardId): TournamentState {
  const revealed = new Set(state.revealedAwards)
  if (revealed.has(awardId)) revealed.delete(awardId)
  else revealed.add(awardId)
  state.revealedAwards = [...revealed]
  return commit()
}

/** Replaces the set of revealed mentions (reveal-all / hide-all). */
export function setRevealedAwards(awardIds: AwardId[]): TournamentState {
  state.revealedAwards = [...new Set(awardIds)]
  return commit()
}

export function renameTeam(teamId: string, name: string): TournamentState {
  const team = state.teams.find((t) => t.id === teamId)
  if (team) team.name = name.trim() || team.name
  return commit()
}

// --- Games (host-authored) ---------------------------------------------------

/** Adds a host-created game to the end of the list. */
export function addGame(def: Partial<GameDef>): TournamentState {
  const game: Game = {
    id: def.id?.trim() || randomUUID(),
    title: def.title?.trim() || 'Neues Spiel',
    short: def.short?.trim() || '',
    rules: def.rules?.trim() || '',
    location: def.location ?? 'both',
    scoringType: def.scoringType ?? 'points',
    tracksMetric: def.tracksMetric,
    metricLabel: def.metricLabel,
    metricUnit: def.metricUnit,
    metricLowerIsBetter: def.metricLowerIsBetter,
    materials: def.materials,
    hostNote: def.hostNote,
    order: state.games.length,
    status: 'todo',
  }
  state.games.push(game)
  return commit()
}

/** Patches editable fields of a game; id, order and status stay untouched. */
export function updateGame(gameId: string, patch: Partial<GameDef>): TournamentState {
  const game = findGame(gameId)
  if (!game) return state
  const { id: _id, ...rest } = patch
  Object.assign(game, rest)
  return commit()
}

export function removeGame(gameId: string): TournamentState {
  state.games = state.games.filter((g) => g.id !== gameId)
  if (state.currentGameId === gameId) state.currentGameId = null
  reindexGames()
  return commit()
}

/** Reorders games to match the given id sequence (unknown ids are ignored). */
export function reorderGames(orderedIds: string[]): TournamentState {
  const byId = new Map(state.games.map((g) => [g.id, g]))
  const next = orderedIds.map((id) => byId.get(id)).filter((g): g is Game => Boolean(g))
  for (const g of state.games) if (!orderedIds.includes(g.id)) next.push(g)
  state.games = next
  reindexGames()
  return commit()
}

export function loadExampleGames(): TournamentState {
  state.games = EXAMPLE_GAMES.map(toGame)
  state.currentGameId = null
  return commit()
}

export function clearGames(): TournamentState {
  state.games = []
  state.currentGameId = null
  return commit()
}

// --- Draw & flow -------------------------------------------------------------

/** Applies a name→team assignment: creates players, updates rosters, resets tips. */
function applyTeams(assignment: { name: string; teamId: string }[]): TournamentState {
  const players: Player[] = assignment
    .filter((a) => a.name.trim() && teamIds().includes(a.teamId))
    .map((a) => ({ id: randomUUID(), name: a.name.trim(), teamId: a.teamId }))
  state.roster = players.map((p) => p.name)
  state.players = players
  for (const team of state.teams) {
    team.playerIds = players.filter((p) => p.teamId === team.id).map((p) => p.id)
  }
  // New players get new ids, so any predictions from a previous draw are stale.
  state.predictions = []
  state.status = 'draw'
  return commit()
}

/** Draws the entered names randomly and evenly across the teams. */
export function drawTournamentTeams(names: string[]): TournamentState {
  return applyTeams(drawTeams(names, teamIds()))
}

/** Sets teams from an explicit host-chosen assignment (manual mode). */
export function setTeams(assignment: { name: string; teamId: string }[]): TournamentState {
  return applyTeams(assignment)
}

export function setCurrentGame(gameId: string | null): TournamentState {
  if (gameId) {
    const g = findGame(gameId)
    // Only start an existing, enabled game — and only once teams exist.
    if (!g || g.enabled === false || state.players.length === 0) return state
  }
  for (const g of state.games) {
    if (g.status === 'active') g.status = 'done'
  }
  state.currentGameId = gameId
  if (gameId) {
    const g = findGame(gameId)
    if (g) {
      // Reopening a game clears its previous result so scores don't double-count.
      g.status = 'active'
      g.winnerTeamId = null
      state.scoreEvents = state.scoreEvents.filter((e) => e.gameId !== gameId)
    }
    state.status = 'running'
  }
  return commit()
}

// --- Scoring -----------------------------------------------------------------

/** Undoes the most recent points entry (optionally filtered by game). */
export function undoLastScore(gameId?: string): TournamentState {
  for (let i = state.scoreEvents.length - 1; i >= 0; i--) {
    if (!gameId || state.scoreEvents[i]?.gameId === gameId) {
      const [removed] = state.scoreEvents.splice(i, 1)
      // If we undid the winning award, reopen the game so it isn't left marked
      // as won with no points behind it.
      if (removed?.gameId) {
        const g = findGame(removed.gameId)
        if (g && g.status === 'done') {
          g.status = 'active'
          g.winnerTeamId = null
        }
      }
      break
    }
  }
  return commit()
}

/** Marks the winner — a game win is worth exactly one point — and closes it. */
export function awardGameWin(gameId: string, teamId: string): TournamentState {
  const game = findGame(gameId)
  if (!game || !state.teams.some((t) => t.id === teamId)) return state
  // Replace any previous result for this game (re-award / correction) so a game
  // can never contribute more than one point.
  state.scoreEvents = state.scoreEvents.filter((e) => e.gameId !== gameId)
  state.scoreEvents.push({
    id: randomUUID(),
    gameId,
    teamId,
    delta: POINTS_PER_WIN,
    note: game.title,
    ts: Date.now(),
  })
  game.winnerTeamId = teamId
  game.status = 'done'
  return commit()
}

export function setGameMetric(gameId: string, teamId: string, value: number): TournamentState {
  const game = findGame(gameId)
  if (game) game.metricByTeam = { ...(game.metricByTeam ?? {}), [teamId]: value }
  return commit()
}

// --- Predictions -------------------------------------------------------------

export function upsertPrediction(
  playerId: string,
  scope: PredictionScope,
  target: string,
  refs: { gameId?: string; awardId?: AwardId } = {},
): TournamentState {
  const existing = state.predictions.find(
    (p) =>
      p.playerId === playerId &&
      p.scope === scope &&
      p.gameId === refs.gameId &&
      p.awardId === refs.awardId,
  )
  if (existing) {
    existing.target = target
    existing.ts = Date.now()
  } else {
    state.predictions.push({
      id: randomUUID(),
      playerId,
      scope,
      target,
      gameId: refs.gameId,
      awardId: refs.awardId,
      ts: Date.now(),
    })
  }
  return commit()
}

/** A guest claims their player and sets the public display name (host sees both). */
export function claimPlayer(playerId: string, displayName: string): TournamentState {
  const player = state.players.find((p) => p.id === playerId)
  if (player) player.displayName = displayName.trim() || undefined
  return commit()
}

/**
 * Soft reset for a rerun: keeps the games (library + selection) and the entered
 * roster, but undoes the draw, points, predictions and every game result.
 */
export function softReset(): TournamentState {
  state.players = []
  for (const team of state.teams) team.playerIds = []
  state.scoreEvents = []
  state.predictions = []
  state.currentGameId = null
  for (const g of state.games) {
    g.status = 'todo'
    g.winnerTeamId = null
    delete g.metricByTeam
  }
  state.status = 'setup'
  state.pause = 'none'
  state.revealedAwards = []
  return commit()
}

/** Full reset back to factory state (fresh example games, empty roster). */
export function resetTournament(): TournamentState {
  state = createInitialState()
  return commit()
}
