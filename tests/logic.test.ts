import { describe, expect, it } from 'vitest'
import {
  awardWinners,
  clampIndex,
  clampText,
  freshWinId,
  computeAwards,
  computeTotals,
  drawTeams,
  findPlayerByName,
  leadingTeam,
  pickLanIp,
  predictionStanding,
  recentWins,
  scorePredictions,
  shuffle,
  validateDisplayName,
} from '../core/logic'
import type { PredictionScore } from '../core/logic'
import {
  PREDICTION_AWARD_POINTS,
  PREDICTION_GAME_POINTS,
  PREDICTION_TOURNAMENT_POINTS,
} from '../core/constants'
import type { Award, Game, Player, Prediction, ScoreEvent } from '../core/types'

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

describe('clampIndex', () => {
  it('keeps an in-range index', () => {
    expect(clampIndex(2, 5)).toBe(2)
  })
  it('clamps below 0 and above the last index', () => {
    expect(clampIndex(-3, 5)).toBe(0)
    expect(clampIndex(9, 5)).toBe(4)
  })
  it('returns 0 for an empty list', () => {
    expect(clampIndex(0, 0)).toBe(0)
    expect(clampIndex(3, 0)).toBe(0)
  })
  it('truncates a fractional index', () => {
    expect(clampIndex(2.9, 5)).toBe(2)
  })
})

describe('clampText', () => {
  it('trims and caps a string at the limit', () => {
    expect(clampText('  hello  ', 10)).toBe('hello')
    expect(clampText('abcdefghij', 5)).toBe('abcde')
  })
  it('coerces non-strings without throwing, empty for nullish', () => {
    expect(clampText(42, 10)).toBe('42')
    expect(clampText(null, 10)).toBe('')
    expect(clampText(undefined, 10)).toBe('')
  })
})

describe('freshWinId', () => {
  it('returns the single newly-added win id', () => {
    expect(freshWinId(new Set(['a']), ['a', 'b'])).toBe('b')
  })
  it('returns null when nothing is new (e.g. after an undo)', () => {
    expect(freshWinId(new Set(['a', 'b']), ['a'])).toBeNull()
    expect(freshWinId(new Set(['a']), ['a'])).toBeNull()
  })
  it('returns null when several are new at once (reconnect catch-up)', () => {
    expect(freshWinId(new Set(['a']), ['a', 'b', 'c'])).toBeNull()
  })
  it('fires for a re-award (one removed, one added)', () => {
    expect(freshWinId(new Set(['a', 'b', 'c']), ['a', 'b', 'd'])).toBe('d')
  })
})

describe('computeTotals', () => {
  it('sums deltas per team', () => {
    const events: ScoreEvent[] = [
      { id: '1', gameId: 'g', teamId: 'a', delta: 3, ts: 0 },
      { id: '2', gameId: 'g', teamId: 'a', delta: 2, ts: 0 },
      { id: '3', gameId: 'g', teamId: 'b', delta: 5, ts: 0 },
    ]
    expect(computeTotals(events, ['a', 'b'])).toEqual({ a: 5, b: 5 })
  })

  it('returns zeros for teams without events (non-happy path)', () => {
    expect(computeTotals([], ['a', 'b'])).toEqual({ a: 0, b: 0 })
  })

  it('ignores events for unknown teams', () => {
    const events: ScoreEvent[] = [{ id: '1', gameId: null, teamId: 'ghost', delta: 9, ts: 0 }]
    expect(computeTotals(events, ['a'])).toEqual({ a: 0 })
  })
})

describe('shuffle', () => {
  it('keeps every element (identity rng)', () => {
    const out = shuffle([1, 2, 3, 4], () => 0)
    expect([...out].sort()).toEqual([1, 2, 3, 4])
  })
})

describe('drawTeams', () => {
  it('splits 10 names evenly across two teams', () => {
    const names = Array.from({ length: 10 }, (_, i) => `P${i}`)
    const res = drawTeams(names, ['a', 'b'], () => 0)
    expect(res).toHaveLength(10)
    expect(res.filter((r) => r.teamId === 'a')).toHaveLength(5)
    expect(res.filter((r) => r.teamId === 'b')).toHaveLength(5)
  })

  it('trims and drops empty names (non-happy path)', () => {
    const res = drawTeams(['  Anna ', '', '   ', 'Ben'], ['a', 'b'], () => 0)
    expect(res.map((r) => r.name).sort()).toEqual(['Anna', 'Ben'])
  })

  it('returns nothing when there are no teams', () => {
    expect(drawTeams(['Anna'], [], () => 0)).toEqual([])
  })
})

describe('scorePredictions', () => {
  const games = [game('g1', { winnerTeamId: 'a' }), game('g2', { winnerTeamId: 'b' })]

  it('awards points for correct game and tournament tips', () => {
    const predictions: Prediction[] = [
      { id: '1', playerId: 'kim', scope: 'game', gameId: 'g1', target: 'a', ts: 0 },
      { id: '2', playerId: 'kim', scope: 'tournament', target: 'a', ts: 0 },
      { id: '3', playerId: 'lee', scope: 'game', gameId: 'g1', target: 'b', ts: 0 },
    ]
    const board = scorePredictions(predictions, games, 'a')
    expect(board[0]).toMatchObject({
      playerId: 'kim',
      points: PREDICTION_GAME_POINTS + PREDICTION_TOURNAMENT_POINTS,
      correctGames: 1,
      correctTournament: true,
    })
    expect(board.find((b) => b.playerId === 'lee')?.points).toBe(0)
  })

  it('gives no tournament points when no winner yet (non-happy path)', () => {
    const predictions: Prediction[] = [
      { id: '1', playerId: 'kim', scope: 'tournament', target: 'a', ts: 0 },
    ]
    expect(scorePredictions(predictions, games, null)[0]?.points).toBe(0)
  })
})

describe('computeAwards', () => {
  it('derives the fastest/slowest time awards (no point-based team awards)', () => {
    const games = [
      game('g1', { winnerTeamId: 'a' }),
      game('g2', { winnerTeamId: 'a' }),
      game('g3', {
        winnerTeamId: 'b',
        tracksMetric: true,
        metricUnit: 's',
        metricLowerIsBetter: true,
        metricByTeam: { a: 30, b: 20 },
      }),
    ]
    const awards = computeAwards(games, [], 'a')
    expect(awards.find((x) => x.id === 'fastest')).toMatchObject({ teamId: 'b', value: 20 })
    expect(awards.find((x) => x.id === 'slowest')).toMatchObject({ teamId: 'a', value: 30 })
  })

  it('omits awards without data (non-happy path)', () => {
    const awards = computeAwards([], [], null)
    expect(awards).toEqual([])
  })

  it('does not award fastest/slowest for a higher-is-better metric (non-happy path)', () => {
    const games = [
      game('g1', {
        winnerTeamId: 'a',
        tracksMetric: true,
        metricUnit: 's',
        metricLowerIsBetter: false,
        metricByTeam: { a: 10, b: 20 },
      }),
    ]
    const awards = computeAwards(games, [], null)
    expect(awards.find((x) => x.id === 'fastest')).toBeUndefined()
    expect(awards.find((x) => x.id === 'slowest')).toBeUndefined()
  })

  it('awards the longest winning streak by play order', () => {
    const games = [
      game('g1', { order: 0, winnerTeamId: 'a' }),
      game('g2', { order: 1, winnerTeamId: 'a' }),
      game('g3', { order: 2, winnerTeamId: 'a' }),
      game('g4', { order: 3, winnerTeamId: 'b' }),
    ]
    expect(computeAwards(games, [], 'a').find((x) => x.id === 'streak')).toMatchObject({
      teamId: 'a',
      value: 3,
    })
  })

  it('gives no streak award when wins never repeat (non-happy path)', () => {
    const games = [
      game('g1', { order: 0, winnerTeamId: 'a' }),
      game('g2', { order: 1, winnerTeamId: 'b' }),
      game('g3', { order: 2, winnerTeamId: 'a' }),
    ]
    expect(computeAwards(games, [], null).find((x) => x.id === 'streak')).toBeUndefined()
  })

  it('awards daredevil (most bets) and unlucky (most wrong) among frequent bettors', () => {
    const games = [
      game('g1', { winnerTeamId: 'a' }),
      game('g2', { winnerTeamId: 'a' }),
      game('g3', { winnerTeamId: 'a' }),
      game('g4', { winnerTeamId: 'a' }),
    ]
    const bet = (id: string, playerId: string, gameId: string, target: string): Prediction => ({
      id,
      playerId,
      scope: 'game',
      gameId,
      target,
      ts: 0,
    })
    const predictions: Prediction[] = [
      bet('1', 'kim', 'g1', 'a'),
      bet('2', 'kim', 'g2', 'a'),
      bet('3', 'kim', 'g3', 'a'),
      bet('4', 'kim', 'g4', 'b'),
      bet('5', 'lee', 'g1', 'b'),
      bet('6', 'lee', 'g2', 'b'),
      bet('7', 'lee', 'g3', 'b'),
      bet('8', 'lee', 'g4', 'b'),
    ]
    const awards = computeAwards(games, predictions, 'a')
    expect(awards.find((x) => x.id === 'draufgaenger')).toMatchObject({ playerId: 'kim', value: 4 })
    expect(awards.find((x) => x.id === 'pechvogel')).toMatchObject({ playerId: 'lee', value: 4 })
  })

  it('gives no guest awards below the minimum bet count (non-happy path)', () => {
    const games = [game('g1', { winnerTeamId: 'a' })]
    const predictions: Prediction[] = [
      { id: '1', playerId: 'kim', scope: 'game', gameId: 'g1', target: 'a', ts: 0 },
      { id: '2', playerId: 'kim', scope: 'tournament', target: 'a', ts: 0 },
    ]
    const awards = computeAwards(games, predictions, 'a')
    expect(awards.find((x) => x.id === 'draufgaenger')).toBeUndefined()
    expect(awards.find((x) => x.id === 'pechvogel')).toBeUndefined()
  })
})

const player = (id: string, name: string, displayName?: string): Player => ({
  id,
  name,
  displayName,
  teamId: null,
})

describe('leadingTeam', () => {
  it('returns the single top team', () => {
    expect(leadingTeam({ a: 3, b: 1 })).toBe('a')
  })

  it('returns null on a tie (non-happy path)', () => {
    expect(leadingTeam({ a: 2, b: 2 })).toBeNull()
  })

  it('returns null when nobody scored (non-happy path)', () => {
    expect(leadingTeam({ a: 0, b: 0 })).toBeNull()
    expect(leadingTeam({})).toBeNull()
  })
})

describe('pickLanIp', () => {
  it('prefers the 192.168 home address over virtual adapters', () => {
    expect(pickLanIp(['172.21.112.1', '10.5.0.2', '192.168.178.35'])).toBe('192.168.178.35')
  })

  it('falls back through 10.x then 172.x', () => {
    expect(pickLanIp(['172.16.0.1', '10.0.0.5'])).toBe('10.0.0.5')
  })

  it('ignores link-local and returns null when nothing usable (non-happy path)', () => {
    expect(pickLanIp(['169.254.1.1'])).toBeNull()
    expect(pickLanIp([])).toBeNull()
  })
})

describe('findPlayerByName', () => {
  const players = [player('1', 'Nina'), player('2', 'Ben')]

  it('matches case-insensitively and trims', () => {
    expect(findPlayerByName(players, '  nINa ')?.id).toBe('1')
  })

  it('returns null for an unknown or empty name (non-happy path)', () => {
    expect(findPlayerByName(players, 'Zoe')).toBeNull()
    expect(findPlayerByName(players, '   ')).toBeNull()
  })
})

describe('validateDisplayName', () => {
  const players = [player('1', 'Nina', 'Bärchen'), player('2', 'Ben')]

  it('accepts a fresh nickname', () => {
    expect(validateDisplayName('Sunny', players, '2')).toBeNull()
  })

  it('rejects an empty name', () => {
    expect(validateDisplayName('   ', players, '2')).toBe('empty')
  })

  it('rejects a name equal to a real player name (case-insensitive)', () => {
    expect(validateDisplayName('nina', players, '2')).toBe('isRealName')
  })

  it("rejects another player's display name (case-insensitive)", () => {
    expect(validateDisplayName('bärchen', players, '2')).toBe('taken')
  })

  it("allows keeping one's own display name", () => {
    expect(validateDisplayName('Bärchen', players, '1')).toBeNull()
  })
})

describe('award bets', () => {
  const games = [game('g1', { winnerTeamId: 'a' })]
  const awards: Award[] = [
    { id: 'fastest', teamId: 'a', value: 1 },
    { id: 'tipp-koenig', playerId: 'kim', value: 3 },
  ]

  it('maps award winners by id (team or player)', () => {
    expect(awardWinners(awards)).toEqual({ fastest: 'a', 'tipp-koenig': 'kim' })
  })

  it('scores a team award bet only once the awards are passed', () => {
    const predictions: Prediction[] = [
      { id: '1', playerId: 'kim', scope: 'award', awardId: 'fastest', target: 'a', ts: 0 },
      { id: '2', playerId: 'lee', scope: 'award', awardId: 'fastest', target: 'b', ts: 0 },
    ]
    expect(scorePredictions(predictions, games, null)[0]?.points).toBe(0)
    const board = scorePredictions(predictions, games, null, awards)
    expect(board.find((b) => b.playerId === 'kim')).toMatchObject({
      points: PREDICTION_AWARD_POINTS,
      correctAwards: 1,
    })
    expect(board.find((b) => b.playerId === 'lee')?.points).toBe(0)
  })

  it('scores a person award bet (tipp-koenig)', () => {
    const predictions: Prediction[] = [
      { id: '1', playerId: 'lee', scope: 'award', awardId: 'tipp-koenig', target: 'kim', ts: 0 },
    ]
    const board = scorePredictions(predictions, games, null, awards)
    expect(board.find((b) => b.playerId === 'lee')?.points).toBe(PREDICTION_AWARD_POINTS)
  })
})

describe('predictionStanding', () => {
  const score = (playerId: string, points: number): PredictionScore => ({
    playerId,
    points,
    correctGames: 0,
    correctTournament: false,
    correctAwards: 0,
  })
  // Board is pre-sorted by points desc, as scorePredictions returns it.
  const board = [score('a', 5), score('b', 3), score('c', 3), score('d', 0)]

  it('reports points, competition rank and field size', () => {
    expect(predictionStanding(board, 'a')).toEqual({ rank: 1, points: 5, total: 4 })
    expect(predictionStanding(board, 'd')).toEqual({ rank: 4, points: 0, total: 4 })
  })

  it('gives tied players the same rank', () => {
    // b and c both have 3 points and rank behind only a.
    expect(predictionStanding(board, 'b')).toEqual({ rank: 2, points: 3, total: 4 })
    expect(predictionStanding(board, 'c')).toEqual({ rank: 2, points: 3, total: 4 })
  })

  it('returns null for a player not on the board', () => {
    expect(predictionStanding(board, 'zzz')).toBeNull()
    expect(predictionStanding([], 'a')).toBeNull()
  })
})

describe('recentWins', () => {
  const ev = (id: string, ts: number, delta = 1): ScoreEvent => ({
    id,
    gameId: `g-${id}`,
    teamId: 'a',
    delta,
    ts,
  })

  it('returns wins newest first, capped at the limit', () => {
    const events = [ev('1', 100), ev('2', 300), ev('3', 200)]
    expect(recentWins(events, 2).map((e) => e.id)).toEqual(['2', '3'])
  })

  it('ignores non-positive entries (e.g. corrections)', () => {
    const events = [ev('1', 100), ev('2', 200, 0), ev('3', 300, -1)]
    expect(recentWins(events, 5).map((e) => e.id)).toEqual(['1'])
  })

  it('does not mutate the input order', () => {
    const events = [ev('1', 100), ev('2', 300)]
    recentWins(events, 5)
    expect(events.map((e) => e.id)).toEqual(['1', '2'])
  })

  it('handles an empty log', () => {
    expect(recentWins([], 5)).toEqual([])
  })
})
