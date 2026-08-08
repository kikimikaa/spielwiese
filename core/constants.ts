// Central constants — no magic values in the logic.
import type { AwardId, AwardTarget, GameKind, GameLocation, ScoringType } from './types'

/**
 * Bumped whenever the exported config/state shape changes incompatibly, so an
 * import can reject or migrate files written by a different version.
 */
export const CONFIG_SCHEMA_VERSION = 1

/** Every valid game type — the runtime source for validation and the form. */
export const GAME_KINDS: GameKind[] = ['freeform', 'quiz', 'estimate', 'choice']

/** Every valid game location — the runtime source for import validation. */
export const GAME_LOCATIONS: GameLocation[] = ['outdoor', 'indoor', 'both']

/** Every valid scoring type — the runtime source for import validation. */
export const SCORING_TYPES: ScoringType[] = [
  'points',
  'versus',
  'stations',
  'measure',
  'betting',
  'pass-fail',
  'final-lives',
]

/** WebSocket route (must match the handler under server/routes). */
export const WS_ROUTE = '/_ws'

/** Channel name that board updates are published on. */
export const WS_TOPIC_STATE = 'state'

/** 5 vs 5 — team size per the tournament plan. */
export const TEAM_SIZE = 5

/** Scoring is dead simple: winning a game is worth exactly one point. */
export const POINTS_PER_WIN = 1

/** Tournament date (19 Sept). */
export const TOURNAMENT_DATE = '2026-09-19'
export const TOURNAMENT_DEFAULT_NAME = 'Sommer-Turnier'

/**
 * Default teams. Colours are colour-blind-safe (teal vs. orange) and readable
 * on a light background (bright sunlight); names are editable in the host view.
 */
export const DEFAULT_TEAMS = [
  { name: 'Team Welle', color: '#0CA678' },
  { name: 'Team Sonne', color: '#F08C00' },
] as const

/** Prediction points per bet type. */
export const PREDICTION_GAME_POINTS = 1
export const PREDICTION_TOURNAMENT_POINTS = 3
export const PREDICTION_AWARD_POINTS = 2

/** A "streak" needs at least two games in a row to be worth mentioning. */
export const MIN_STREAK_FOR_AWARD = 2
/**
 * Minimum bets before a guest qualifies for the "daredevil"/"unlucky" mentions,
 * so a single lucky/unlucky tip can't win them.
 */
export const MIN_BETS_FOR_GUEST_AWARD = 3

/** Every honorable mention id — the single source for validation and reveal-all. */
export const AWARD_IDS: AwardId[] = [
  'fastest',
  'slowest',
  'streak',
  'tipp-koenig',
  'draufgaenger',
  'pechvogel',
]

/**
 * Which honorable mentions guests can bet on, and whether the winner is a team
 * or an individual player. Kept small on purpose — a few fun extra bets.
 */
export const AWARD_BETS: { awardId: AwardId; target: AwardTarget }[] = [
  { awardId: 'tipp-koenig', target: 'player' },
]

/** File the live state is persisted to (excluded via .gitignore). */
export const STATE_FILE = 'data/state.json'

/** File the saved tournament snapshots are persisted to (excluded via .gitignore). */
export const SNAPSHOT_FILE = 'data/snapshots.json'
