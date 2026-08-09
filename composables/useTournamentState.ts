import type { Award, AwardId, Game, Player, ScoreEvent, Team, TournamentState } from '../core/types'
import {
  clampIndex,
  computeAwards,
  computeTotals,
  leadingTeam,
  recentWins,
  scorePredictions,
} from '../core/logic'
import { computeRecap } from '../core/analytics'
import { RECENT_ACTIVITY_LIMIT } from '../core/constants'

/**
 * Reactive access to the shared tournament state plus derived getters. The
 * initial snapshot comes from /api/state (SSR + first paint); the live plugin
 * then keeps `tournament-state` up to date over WebSocket.
 */
export function useTournamentState() {
  const state = useState<TournamentState | null>('tournament-state', () => null)
  const connected = useState<boolean>('tournament-connected', () => false)

  const { data } = useAsyncData('tournament-snapshot', () => $fetch<TournamentState>('/api/state'))
  watchEffect(() => {
    if (data.value && !state.value) state.value = data.value
  })

  const teams = computed<Team[]>(() => state.value?.teams ?? [])
  const games = computed<Game[]>(() =>
    [...(state.value?.games ?? [])].sort((a, b) => a.order - b.order),
  )
  // Games actually part of the tournament (the rest sit in the library, unticked).
  const playableGames = computed<Game[]>(() => games.value.filter((g: Game) => g.enabled !== false))
  const currentGame = computed<Game | null>(
    () => games.value.find((g: Game) => g.id === state.value?.currentGameId) ?? null,
  )
  const upcoming = computed<Game[]>(() =>
    playableGames.value.filter(
      (g: Game) => g.status === 'todo' && g.id !== state.value?.currentGameId,
    ),
  )

  const teamIds = computed<string[]>(() => teams.value.map((t: Team) => t.id))
  // Only enabled games count — disabled/library games (and their score events)
  // must never inflate the standings or awards.
  const playableIds = computed<Set<string>>(
    () => new Set(playableGames.value.map((g: Game) => g.id)),
  )
  const scoredEvents = computed<ScoreEvent[]>(() =>
    (state.value?.scoreEvents ?? []).filter(
      (e: ScoreEvent) => e.gameId !== null && playableIds.value.has(e.gameId),
    ),
  )
  const totals = computed<Record<string, number>>(() =>
    computeTotals(scoredEvents.value, teamIds.value),
  )
  const teamById = (id: string | null | undefined) =>
    teams.value.find((t: Team) => t.id === id) ?? null
  const players = computed<Player[]>(() => state.value?.players ?? [])
  const playersOfTeam = (teamId: string) => players.value.filter((p: Player) => p.teamId === teamId)
  const playerById = (id: string | null | undefined) =>
    players.value.find((p: Player) => p.id === id) ?? null
  /** Public label for a player: display name if set, otherwise the real name. */
  const playerLabel = (id: string | null | undefined) => {
    const p = playerById(id)
    return p?.displayName || p?.name || (id ?? '')
  }

  const leader = computed<string | null>(() => leadingTeam(totals.value))

  // How the standings evolved across the tournament — the end-of-event recap.
  const recap = computed(() => computeRecap(playableGames.value, teamIds.value))

  // The latest game wins, newest first — for the spectator activity feed.
  const recentActivity = computed(() => recentWins(scoredEvents.value, RECENT_ACTIVITY_LIMIT))

  // The tournament winner only exists once the ceremony has started; before
  // that, `leader` is just the live points lead and must not score tournament
  // tips or flip the crowned champion.
  const tournamentWinner = computed<string | null>(() =>
    state.value?.status === 'finished' ? leader.value : null,
  )

  const awards = computed(() =>
    computeAwards(playableGames.value, state.value?.predictions ?? [], tournamentWinner.value),
  )
  // Board pointer for the current quiz game, and the question it points at.
  const quiz = computed(() => state.value?.quiz ?? { index: 0, revealed: false })
  const currentQuestion = computed(() => {
    const g = currentGame.value
    if (g?.kind !== 'quiz' || !g.questions?.length) return null
    return g.questions[clampIndex(quiz.value.index, g.questions.length)] ?? null
  })
  const currentEstimate = computed(() => {
    const g = currentGame.value
    return g?.kind === 'estimate' ? (g.estimate ?? null) : null
  })
  const currentChoice = computed(() => {
    const g = currentGame.value
    return g?.kind === 'choice' && g.choice?.options.length ? g.choice : null
  })
  const currentRanking = computed(() => {
    const g = currentGame.value
    return g?.kind === 'ranking' && g.ranking?.items.length ? g.ranking : null
  })
  const currentTrueFalse = computed(() => {
    const g = currentGame.value
    return g?.kind === 'truefalse' && g.truefalse?.statement ? g.truefalse : null
  })
  const currentMatch = computed(() => {
    const g = currentGame.value
    return g?.kind === 'match' && g.match?.pairs.length ? g.match : null
  })
  const currentBuzzer = computed(() => {
    const g = currentGame.value
    return g?.kind === 'buzzer' && g.buzzer?.prompt ? g.buzzer : null
  })

  // Which honorable mentions the host has revealed on the board.
  const revealedAwards = computed<AwardId[]>(() => state.value?.revealedAwards ?? [])
  const isAwardRevealed = (id: AwardId) => revealedAwards.value.includes(id)
  /** i18n interpolation args for an award's `detail` message. */
  const awardDetailArgs = (a: Award) => ({
    team: teamById(a.teamId)?.name ?? '',
    guest: a.playerId ? playerLabel(a.playerId) : '',
    value: a.value ?? 0,
  })

  // Award bets only score once the tournament is finished, so pending bets don't
  // flicker on the leaderboard mid-tournament.
  const scoredAwards = computed(() => (state.value?.status === 'finished' ? awards.value : []))
  const predictionBoard = computed(() =>
    scorePredictions(
      state.value?.predictions ?? [],
      playableGames.value,
      tournamentWinner.value,
      scoredAwards.value,
    ),
  )

  return {
    state,
    connected,
    teams,
    games,
    playableGames,
    currentGame,
    upcoming,
    totals,
    teamById,
    players,
    playersOfTeam,
    playerById,
    playerLabel,
    leader,
    recap,
    recentActivity,
    tournamentWinner,
    predictionBoard,
    awards,
    revealedAwards,
    isAwardRevealed,
    awardDetailArgs,
    quiz,
    currentQuestion,
    currentEstimate,
    currentChoice,
    currentRanking,
    currentTrueFalse,
    currentMatch,
    currentBuzzer,
  }
}
