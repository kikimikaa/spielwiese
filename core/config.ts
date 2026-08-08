// Shareable tournament configuration: the reusable setup (name, date and the
// game library). Deliberately excludes the live/guest data — players, scores and
// predictions — so a config can be shared or handed to another host without
// leaking real guest names or results. Host prep (materials, hostNote) is kept
// on purpose: the recipient is another host who needs it to run the same games.
// Pure and framework-free, so it runs on server and client and is unit-testable.
// The versioned pack/parse pattern here is the foundation the full save/resume
// snapshot (with live data) will build on.

import { CONFIG_SCHEMA_VERSION, GAME_KINDS, GAME_LOCATIONS, SCORING_TYPES } from './constants'
import type { EstimateSpec, GameDef, GameKind, QuizQuestion } from './types'

export interface TournamentConfig {
  schemaVersion: number
  name: string
  date: string
  games: GameDef[]
}

export type ConfigError =
  | 'not-object' // top-level isn't a JSON object
  | 'bad-json' // string input wasn't valid JSON
  | 'missing-version' // schemaVersion absent or not a number
  | 'unsupported-version' // written by a newer/incompatible schema
  | 'invalid-name' // name missing, not a string, or empty
  | 'invalid-date' // date missing, not a string, or empty
  | 'invalid-games' // games missing or not an array
  | 'invalid-game' // a game entry is malformed
  | 'duplicate-id' // two games share the same id

export type ConfigParseResult =
  { ok: true; config: TournamentConfig } | { ok: false; error: ConfigError }

/** Packs the current setup into a shareable, versioned config object. */
export function buildConfig(name: string, date: string, games: GameDef[]): TournamentConfig {
  return {
    schemaVersion: CONFIG_SCHEMA_VERSION,
    name,
    date,
    games: games.map(sanitizeGame),
  }
}

/** Serializes a config to pretty JSON suitable for a downloaded file. */
export function serializeConfig(config: TournamentConfig): string {
  return JSON.stringify(config, null, 2)
}

/** Brand prefix and fallback slug for an exported config's file name. */
const FILE_PREFIX = 'spielwiese'
const FALLBACK_SLUG = 'config'

/**
 * Deterministic download file name for a config, derived from the tournament
 * name: lowercased, non-alphanumerics collapsed to '-', trimmed. Falls back to a
 * fixed slug when the name has no usable characters.
 */
export function configFileName(name: string): string {
  const slug =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || FALLBACK_SLUG
  return `${FILE_PREFIX}-${slug}.json`
}

/**
 * Parses and validates untrusted config input — either a raw string (from a
 * chosen file) or an already-parsed object. Never throws: every failure mode
 * returns a typed error so the caller can show a specific message.
 */
export function parseConfig(input: unknown): ConfigParseResult {
  let value = input
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value)
    } catch {
      return fail('bad-json')
    }
  }

  if (!isRecord(value)) return fail('not-object')
  if (typeof value['schemaVersion'] !== 'number') return fail('missing-version')
  if (value['schemaVersion'] !== CONFIG_SCHEMA_VERSION) return fail('unsupported-version')
  if (!isNonEmptyString(value['name'])) return fail('invalid-name')
  if (!isNonEmptyString(value['date'])) return fail('invalid-date')
  if (!Array.isArray(value['games'])) return fail('invalid-games')

  const games: GameDef[] = []
  const seenIds = new Set<string>()
  for (const raw of value['games']) {
    if (!isValidGame(raw)) return fail('invalid-game')
    if (seenIds.has(raw.id)) return fail('duplicate-id')
    seenIds.add(raw.id)
    games.push(sanitizeGame(raw))
  }

  return {
    ok: true,
    config: {
      schemaVersion: CONFIG_SCHEMA_VERSION,
      name: value['name'],
      date: value['date'],
      games,
    },
  }
}

function fail(error: ConfigError): ConfigParseResult {
  return { ok: false, error }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0
}

function isValidGame(v: unknown): v is GameDef {
  if (!isRecord(v)) return false
  // id and title must be present; short/rules may be empty (addGame defaults them
  // to '' too, so a valid game must survive an export/import round-trip).
  return (
    isNonEmptyString(v['id']) &&
    isNonEmptyString(v['title']) &&
    typeof v['short'] === 'string' &&
    typeof v['rules'] === 'string' &&
    GAME_LOCATIONS.includes(v['location'] as GameDef['location']) &&
    SCORING_TYPES.includes(v['scoringType'] as GameDef['scoringType'])
  )
}

/**
 * Rebuilds a clean GameDef, copying only known fields (so an imported file can't
 * inject arbitrary properties) and dropping optional ones that are absent or the
 * wrong type.
 */
function sanitizeGame(raw: GameDef): GameDef {
  const game: GameDef = {
    id: raw.id,
    title: raw.title,
    short: raw.short,
    rules: raw.rules,
    location: raw.location,
    scoringType: raw.scoringType,
  }
  if (typeof raw.enabled === 'boolean') game.enabled = raw.enabled
  if (typeof raw.tracksMetric === 'boolean') game.tracksMetric = raw.tracksMetric
  if (typeof raw.metricLabel === 'string') game.metricLabel = raw.metricLabel
  if (typeof raw.metricUnit === 'string') game.metricUnit = raw.metricUnit
  if (typeof raw.metricLowerIsBetter === 'boolean')
    game.metricLowerIsBetter = raw.metricLowerIsBetter
  if (typeof raw.materials === 'string') game.materials = raw.materials
  if (typeof raw.hostNote === 'string') game.hostNote = raw.hostNote
  if (GAME_KINDS.includes(raw.kind as GameKind)) game.kind = raw.kind
  // Type-specific content only rides along on its own game type.
  if (game.kind === 'quiz' && Array.isArray(raw.questions)) {
    game.questions = sanitizeQuestions(raw.questions)
  }
  if (game.kind === 'estimate' && isRecord(raw.estimate)) {
    game.estimate = sanitizeEstimate(raw.estimate)
  }
  return game
}

/** Keeps only well-formed {question, answer} string pairs from imported input. */
function sanitizeQuestions(raw: unknown[]): QuizQuestion[] {
  const out: QuizQuestion[] = []
  for (const q of raw) {
    if (isRecord(q) && typeof q['question'] === 'string' && typeof q['answer'] === 'string') {
      out.push({ question: q['question'], answer: q['answer'] })
    }
  }
  return out
}

/** Rebuilds an estimate from imported input, keeping only string fields. */
function sanitizeEstimate(raw: Record<string, unknown>): EstimateSpec {
  const spec: EstimateSpec = {
    prompt: typeof raw['prompt'] === 'string' ? raw['prompt'] : '',
    solution: typeof raw['solution'] === 'string' ? raw['solution'] : '',
  }
  if (typeof raw['unit'] === 'string' && raw['unit']) spec.unit = raw['unit']
  return spec
}
