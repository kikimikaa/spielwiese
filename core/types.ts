// Domain model for Spielwiese. Shared between server (Nitro) and client (Vue),
// so it must stay free of framework dependencies.

export type GameLocation = 'outdoor' | 'indoor' | 'both'

/**
 * How a game produces points. `points` (free assignment) covers every game;
 * the other types are convenience helpers for later dedicated UIs.
 */
export type ScoringType =
  | 'points' // host assigns points per team freely
  | 'versus' // round-based, more hits wins
  | 'stations' // several stations, aggregated
  | 'measure' // best distance / accuracy
  | 'betting' // stake from a points pool
  | 'pass-fail' // per person passed / failed
  | 'final-lives' // accumulated points become lives (the final)

export type TournamentStatus = 'setup' | 'draw' | 'running' | 'awards' | 'finished'
export type GameStatus = 'todo' | 'active' | 'done'
/**
 * Board pause overlay: `break` = short game break (scores stay visible),
 * `suspense` = pre-ceremony pause that HIDES the scores to build excitement.
 */
export type PauseMode = 'none' | 'break' | 'suspense'
export type PredictionScope = 'game' | 'tournament' | 'award'

/**
 * Honorable-mention awards shown before the winner ceremony. Deliberately none
 * that rank teams by points won: scoring is one point per game, so "most
 * points" just is the tournament winner and "most in a single game" is always
 * one — neither makes a meaningful award. These reward things the score can't:
 * measured speed, momentum (a winning streak) and how the guests played their
 * predictions.
 */
export type AwardId =
  'fastest' | 'slowest' | 'streak' | 'tipp-koenig' | 'draufgaenger' | 'pechvogel'
/** Whether an award is won by a team or an individual player. */
export type AwardTarget = 'team' | 'player'

export interface Award {
  id: AwardId
  teamId?: string
  playerId?: string
  value?: number
}

/**
 * A game definition. Games are host-authored content (created/edited in the
 * host view), so the text fields are plain data in whatever language the host
 * types — they are NOT translated via i18n. Only the app chrome is localized.
 * The bundled example games ship as editable seed data.
 */
export interface GameDef {
  id: string
  title: string
  /** One-line summary shown on the board. */
  short: string
  /** Full rules. */
  rules: string
  location: GameLocation
  scoringType: ScoringType
  /**
   * Whether this game is part of the current tournament. All games live in the
   * library; only enabled ones are played and counted. Missing = enabled (so
   * older data and seeds default to "in").
   */
  enabled?: boolean
  /** Whether a time/distance is recorded (needed for the fastest/slowest awards). */
  tracksMetric?: boolean
  /** Label for the recorded metric, e.g. "Weite" or "Gesamtzeit". */
  metricLabel?: string
  metricUnit?: string
  metricLowerIsBetter?: boolean
  /** What the host needs for this game (e.g. "Zollstock, Stoppuhr"). Host-only. */
  materials?: string
  /** Host-only notes / questions / content for the game. Host-only. */
  hostNote?: string
  /**
   * Game type. `freeform` (default, missing = freeform) is the plain game the
   * host runs manually. `quiz` carries `questions` that are shown one at a time
   * on the board and revealed by the host — scoring is unchanged either way.
   */
  kind?: GameKind
  /** Quiz question/answer pairs; only meaningful for `kind === 'quiz'`. */
  questions?: QuizQuestion[]
}

export type GameKind = 'freeform' | 'quiz'

/** A single quiz question and its answer (host-authored plain text). */
export interface QuizQuestion {
  question: string
  answer: string
}

export interface Player {
  id: string
  /** Real name as entered by the host when drawing teams. */
  name: string
  /** Public display name the guest picks on their device (host sees both). */
  displayName?: string
  teamId: string | null
}

export interface Team {
  id: string
  name: string
  color: string
  playerIds: string[]
}

/** Runtime state of a game within the tournament. */
export interface Game extends GameDef {
  order: number
  status: GameStatus
  winnerTeamId?: string | null
  /** Optional recorded metric per team (e.g. time in seconds, distance in cm). */
  metricByTeam?: Record<string, number>
}

/** A single points entry — the log makes every award undoable. */
export interface ScoreEvent {
  id: string
  gameId: string | null
  teamId: string
  delta: number
  note?: string
  ts: number
}

/**
 * A bet, tied to a real player (via playerId). `target` is the predicted
 * outcome id — a team id for game/tournament/team-award bets, or a player id for
 * player-award bets. `gameId` scopes a game bet, `awardId` an award bet.
 */
export interface Prediction {
  id: string
  playerId: string
  scope: PredictionScope
  gameId?: string
  awardId?: AwardId
  target: string
  ts: number
}

export interface TournamentState {
  name: string
  date: string
  status: TournamentStatus
  /** Board pause overlay controlled by the host. */
  pause: PauseMode
  /** The names the host entered, kept so a soft reset can re-draw the same people. */
  roster: string[]
  teams: Team[]
  players: Player[]
  games: Game[]
  currentGameId: string | null
  scoreEvents: ScoreEvent[]
  predictions: Prediction[]
  /** Honorable mentions the host has already revealed on the board, in order. */
  revealedAwards: AwardId[]
  /** Board pointer for the current quiz game: which question, and whether the answer is shown. */
  quiz: QuizPointer
}

export interface QuizPointer {
  index: number
  revealed: boolean
}
