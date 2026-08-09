import { describe, expect, it } from 'vitest'
import { buildConfig, configFileName, parseConfig, serializeConfig } from '../core/config'
import { CONFIG_SCHEMA_VERSION } from '../core/constants'
import type { GameDef } from '../core/types'

const game = (over: Partial<GameDef> = {}): GameDef => ({
  id: 'g1',
  title: 'Sackhüpfen',
  short: 'Hüpfen bis zum Ziel',
  rules: 'Erstes Team im Ziel gewinnt.',
  location: 'outdoor',
  scoringType: 'versus',
  ...over,
})

describe('buildConfig', () => {
  it('stamps the current schema version and keeps name, date and games', () => {
    const config = buildConfig('Sommerfest', '2026-09-19', [game()])
    expect(config.schemaVersion).toBe(CONFIG_SCHEMA_VERSION)
    expect(config.name).toBe('Sommerfest')
    expect(config.date).toBe('2026-09-19')
    expect(config.games).toHaveLength(1)
  })

  it('drops unknown/live fields from games (no scores or players leak)', () => {
    const dirty = { ...game(), winnerTeamId: 'team-a', secret: 'x' } as unknown as GameDef
    const config = buildConfig('T', '2026-01-01', [dirty])
    expect(config.games[0]).not.toHaveProperty('winnerTeamId')
    expect(config.games[0]).not.toHaveProperty('secret')
  })
})

describe('parseConfig round-trip', () => {
  it('parses what serializeConfig writes', () => {
    const original = buildConfig('Turnier', '2026-09-19', [
      game({ enabled: true, tracksMetric: true, metricUnit: 's', metricLowerIsBetter: true }),
    ])
    const result = parseConfig(serializeConfig(original))
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.config).toEqual(original)
  })

  it('accepts an already-parsed object, not just a string', () => {
    const result = parseConfig(buildConfig('T', '2026-01-01', [game()]))
    expect(result.ok).toBe(true)
  })

  it('round-trips quiz kind and questions, dropping malformed rows', () => {
    const result = parseConfig({
      schemaVersion: CONFIG_SCHEMA_VERSION,
      name: 'T',
      date: 'x',
      games: [
        {
          ...game(),
          kind: 'quiz',
          questions: [
            { question: 'Q1', answer: 'A1' },
            { question: 'Q2', answer: 5 }, // wrong type -> dropped
            'nope', // not an object -> dropped
          ],
        },
      ],
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.config.games[0]?.kind).toBe('quiz')
      expect(result.config.games[0]?.questions).toEqual([{ question: 'Q1', answer: 'A1' }])
    }
  })

  it('drops questions on a non-quiz game', () => {
    const result = parseConfig({
      schemaVersion: CONFIG_SCHEMA_VERSION,
      name: 'T',
      date: 'x',
      games: [{ ...game(), kind: 'freeform', questions: [{ question: 'q', answer: 'a' }] }],
    })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.config.games[0]).not.toHaveProperty('questions')
  })

  it('round-trips an estimate, keeping the unit and coercing a numeric solution', () => {
    const result = parseConfig({
      schemaVersion: CONFIG_SCHEMA_VERSION,
      name: 'T',
      date: 'x',
      games: [
        {
          ...game(),
          id: 'e1',
          kind: 'estimate',
          estimate: { prompt: 'How tall?', solution: '330', unit: 'm' },
        },
        { ...game(), id: 'e2', kind: 'estimate', estimate: { prompt: 'How many?', solution: 42 } },
      ],
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.config.games[0]?.estimate).toEqual({
        prompt: 'How tall?',
        solution: '330',
        unit: 'm',
      })
      // A numeric solution is coerced to text, not dropped.
      expect(result.config.games[1]?.estimate).toEqual({ prompt: 'How many?', solution: '42' })
    }
  })

  it('drops the estimate on a non-estimate game', () => {
    const result = parseConfig({
      schemaVersion: CONFIG_SCHEMA_VERSION,
      name: 'T',
      date: 'x',
      games: [{ ...game(), kind: 'quiz', estimate: { prompt: 'p', solution: 's' } }],
    })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.config.games[0]).not.toHaveProperty('estimate')
  })

  it('round-trips a choice, coercing numeric options and re-mapping correct past empties', () => {
    const result = parseConfig({
      schemaVersion: CONFIG_SCHEMA_VERSION,
      name: 'T',
      date: 'x',
      games: [
        {
          ...game(),
          id: 'c1',
          kind: 'choice',
          choice: { prompt: 'Largest?', options: ['Mars', 'Jupiter', 'Saturn'], correct: 1 },
        },
        {
          ...game(),
          id: 'c2',
          kind: 'choice',
          // An empty option before the correct one is dropped; `correct` follows it.
          choice: { prompt: 'Pick', options: ['', 42, 'right'], correct: 2 },
        },
      ],
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.config.games[0]?.choice).toEqual({
        prompt: 'Largest?',
        options: ['Mars', 'Jupiter', 'Saturn'],
        correct: 1,
      })
      // '' dropped, 42 coerced to '42', correct re-mapped from index 2 to 1.
      expect(result.config.games[1]?.choice).toEqual({
        prompt: 'Pick',
        options: ['42', 'right'],
        correct: 1,
      })
    }
  })

  it('drops the choice on a non-choice game', () => {
    const result = parseConfig({
      schemaVersion: CONFIG_SCHEMA_VERSION,
      name: 'T',
      date: 'x',
      games: [
        { ...game(), kind: 'quiz', choice: { prompt: 'p', options: ['a', 'b'], correct: 0 } },
      ],
    })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.config.games[0]).not.toHaveProperty('choice')
  })

  it('round-trips a ranking, coercing numeric items and dropping empties in order', () => {
    const result = parseConfig({
      schemaVersion: CONFIG_SCHEMA_VERSION,
      name: 'T',
      date: 'x',
      games: [
        {
          ...game(),
          kind: 'ranking',
          ranking: { prompt: 'By year', items: ['1990', 2000, '', '  ', 2010] },
        },
      ],
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      // Numbers coerced to text, empty/blank rows dropped, order preserved.
      expect(result.config.games[0]?.ranking).toEqual({
        prompt: 'By year',
        items: ['1990', '2000', '2010'],
      })
    }
  })

  it('drops the ranking on a non-ranking game', () => {
    const result = parseConfig({
      schemaVersion: CONFIG_SCHEMA_VERSION,
      name: 'T',
      date: 'x',
      games: [{ ...game(), kind: 'quiz', ranking: { prompt: 'p', items: ['a', 'b', 'c'] } }],
    })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.config.games[0]).not.toHaveProperty('ranking')
  })

  it('round-trips a true/false, coercing the answer to a strict boolean', () => {
    const result = parseConfig({
      schemaVersion: CONFIG_SCHEMA_VERSION,
      name: 'T',
      date: 'x',
      games: [
        {
          ...game(),
          id: 'tf1',
          kind: 'truefalse',
          truefalse: { statement: 'Real?', answer: true },
        },
        // A truthy-but-not-true answer becomes false, never left as a stray value.
        {
          ...game(),
          id: 'tf2',
          kind: 'truefalse',
          truefalse: { statement: 'Nope', answer: 'yes' },
        },
      ],
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.config.games[0]?.truefalse).toEqual({ statement: 'Real?', answer: true })
      expect(result.config.games[1]?.truefalse).toEqual({ statement: 'Nope', answer: false })
    }
  })

  it('drops the true/false on a non-truefalse game', () => {
    const result = parseConfig({
      schemaVersion: CONFIG_SCHEMA_VERSION,
      name: 'T',
      date: 'x',
      games: [{ ...game(), kind: 'quiz', truefalse: { statement: 's', answer: true } }],
    })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.config.games[0]).not.toHaveProperty('truefalse')
  })

  it('round-trips a match, coercing numeric sides and dropping incomplete pairs in order', () => {
    const result = parseConfig({
      schemaVersion: CONFIG_SCHEMA_VERSION,
      name: 'T',
      date: 'x',
      games: [
        {
          ...game(),
          kind: 'match',
          match: {
            prompt: 'Match them',
            pairs: [
              { left: 'One', right: 1 },
              { left: '', right: 'orphan' },
              { left: 'lonely', right: '  ' },
              { left: 'Two', right: 'B' },
            ],
          },
        },
      ],
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      // Numeric side coerced to text, pairs missing a side dropped, order preserved.
      expect(result.config.games[0]?.match).toEqual({
        prompt: 'Match them',
        pairs: [
          { left: 'One', right: '1' },
          { left: 'Two', right: 'B' },
        ],
      })
    }
  })

  it('drops the match on a non-match game', () => {
    const result = parseConfig({
      schemaVersion: CONFIG_SCHEMA_VERSION,
      name: 'T',
      date: 'x',
      games: [
        { ...game(), kind: 'quiz', match: { prompt: 'p', pairs: [{ left: 'a', right: 'b' }] } },
      ],
    })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.config.games[0]).not.toHaveProperty('match')
  })

  it('keeps only known optional game fields', () => {
    const result = parseConfig({
      schemaVersion: CONFIG_SCHEMA_VERSION,
      name: 'T',
      date: '2026-01-01',
      games: [{ ...game(), enabled: 'yes', hostNote: 42, materials: 'Seil' }],
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.config.games[0]).not.toHaveProperty('enabled') // wrong type dropped
      expect(result.config.games[0]).not.toHaveProperty('hostNote') // wrong type dropped
      expect(result.config.games[0]?.materials).toBe('Seil') // valid kept
    }
  })
})

describe('parseConfig rejects bad input', () => {
  it.each([
    ['null', null, 'not-object'],
    ['undefined', undefined, 'not-object'],
    ['a number', 5, 'not-object'],
    ['an array', [], 'not-object'],
    ['broken JSON', '{ not json', 'bad-json'],
  ] as const)('rejects %s', (_label, input, error) => {
    const result = parseConfig(input)
    expect(result).toEqual({ ok: false, error })
  })

  it.each([
    ['absent', { name: 'T', date: 'x', games: [] }],
    ['undefined', { schemaVersion: undefined, name: 'T', date: 'x', games: [] }],
    ['null', { schemaVersion: null, name: 'T', date: 'x', games: [] }],
    ['a non-number', { schemaVersion: '1', name: 'T', date: 'x', games: [] }],
  ])('reports a %s schema version as missing, not unsupported', (_label, input) => {
    expect(parseConfig(input)).toEqual({ ok: false, error: 'missing-version' })
  })

  it('rejects a newer/incompatible schema version', () => {
    expect(
      parseConfig({ schemaVersion: CONFIG_SCHEMA_VERSION + 1, name: 'T', date: 'x', games: [] }),
    ).toEqual({ ok: false, error: 'unsupported-version' })
  })

  it('rejects a missing, non-string or empty name and date', () => {
    const base = { schemaVersion: CONFIG_SCHEMA_VERSION, games: [] }
    expect(parseConfig({ ...base, date: 'x' })).toEqual({ ok: false, error: 'invalid-name' })
    expect(parseConfig({ ...base, name: 42, date: 'x' })).toEqual({
      ok: false,
      error: 'invalid-name',
    })
    expect(parseConfig({ ...base, name: '', date: 'x' })).toEqual({
      ok: false,
      error: 'invalid-name',
    })
    expect(parseConfig({ ...base, name: 'T' })).toEqual({ ok: false, error: 'invalid-date' })
    expect(parseConfig({ ...base, name: 'T', date: '' })).toEqual({
      ok: false,
      error: 'invalid-date',
    })
  })

  it('rejects games that are not an array', () => {
    expect(
      parseConfig({ schemaVersion: CONFIG_SCHEMA_VERSION, name: 'T', date: 'x', games: {} }),
    ).toEqual({ ok: false, error: 'invalid-games' })
  })

  it.each([
    ['a missing id', { ...game(), id: '' }],
    ['an empty title', { ...game(), title: '' }],
    ['an unknown location', { ...game(), location: 'space' }],
    ['an unknown scoring type', { ...game(), scoringType: 'vibes' }],
    ['a non-string title', { ...game(), title: 7 }],
    ['not an object', 'nope'],
  ])('rejects a game with %s', (_label, bad) => {
    const result = parseConfig({
      schemaVersion: CONFIG_SCHEMA_VERSION,
      name: 'T',
      date: 'x',
      games: [bad],
    })
    expect(result).toEqual({ ok: false, error: 'invalid-game' })
  })

  it('rejects two games that share the same id', () => {
    const result = parseConfig({
      schemaVersion: CONFIG_SCHEMA_VERSION,
      name: 'T',
      date: 'x',
      games: [game({ id: 'dup' }), game({ id: 'dup', title: 'Anders' })],
    })
    expect(result).toEqual({ ok: false, error: 'duplicate-id' })
  })

  it('accepts an empty game library', () => {
    expect(
      parseConfig({ schemaVersion: CONFIG_SCHEMA_VERSION, name: 'T', date: 'x', games: [] }).ok,
    ).toBe(true)
  })

  it('accepts games with empty short and rules (matches addGame defaults)', () => {
    const result = parseConfig({
      schemaVersion: CONFIG_SCHEMA_VERSION,
      name: 'T',
      date: 'x',
      games: [game({ short: '', rules: '' })],
    })
    expect(result.ok).toBe(true)
  })
})

describe('configFileName', () => {
  it.each([
    ['Sommer-Turnier', 'spielwiese-sommer-turnier.json'],
    ['  Garten Cup 2026!  ', 'spielwiese-garten-cup-2026.json'],
    ['Über Ecken & Kanten', 'spielwiese-ber-ecken-kanten.json'],
  ])('slugifies %o', (name, expected) => {
    expect(configFileName(name)).toBe(expected)
  })

  it.each([
    ['', 'spielwiese-config.json'],
    ['   ', 'spielwiese-config.json'],
    ['!!!', 'spielwiese-config.json'],
    ['💥', 'spielwiese-config.json'],
  ])('falls back for a name with no usable characters (%o)', (name, expected) => {
    expect(configFileName(name)).toBe(expected)
  })
})
