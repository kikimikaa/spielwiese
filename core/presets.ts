// Bilingual game presets: ready-made, themed game packs the host can load into
// the library in the current language. Pure and framework-free.
//
// Deliberately NOT the reverted #7 "apply template" model: loading a preset is a
// non-destructive top-up (add the games the library is missing, by id) — it
// never swaps the whole library or clears teams/scores/predictions. Each game is
// authored once in both German and English; loading materialises the variant for
// the active locale into plain, host-editable GameDef data.
import type {
  ChoiceSpec,
  EstimateSpec,
  GameDef,
  GameKind,
  GameLocation,
  MatchSpec,
  QuizQuestion,
  RankingSpec,
  ScoringType,
  TrueFalseSpec,
} from './types'

export type PresetLocale = 'de' | 'en'

/** Presets ship in German and English only; any other UI locale falls back to German. */
export function presetLocaleOf(uiLocale: string): PresetLocale {
  return uiLocale === 'en' ? 'en' : 'de'
}

/** The language-specific text of a preset game; everything a host actually reads. */
interface LocalizedText {
  title: string
  short: string
  rules: string
  materials?: string
  hostNote?: string
  metricLabel?: string
  questions?: QuizQuestion[]
  estimate?: EstimateSpec
  choice?: ChoiceSpec
  ranking?: RankingSpec
  truefalse?: TrueFalseSpec
  match?: MatchSpec
}

/** A preset game: language-neutral settings plus its text in each locale. */
interface LocalizedGame {
  id: string
  location: GameLocation
  scoringType: ScoringType
  kind?: GameKind
  tracksMetric?: boolean
  metricUnit?: string
  metricLowerIsBetter?: boolean
  de: LocalizedText
  en: LocalizedText
}

export interface PresetPack {
  id: string
  games: LocalizedGame[]
}

/** Builds a plain GameDef for one locale, copying only the fields a game type uses. */
function materialize(game: LocalizedGame, locale: PresetLocale): GameDef {
  const t = game[locale]
  const def: GameDef = {
    id: game.id,
    title: t.title,
    short: t.short,
    rules: t.rules,
    location: game.location,
    scoringType: game.scoringType,
  }
  if (game.kind) def.kind = game.kind
  if (t.materials) def.materials = t.materials
  if (t.hostNote) def.hostNote = t.hostNote
  if (game.tracksMetric) {
    def.tracksMetric = true
    if (t.metricLabel) def.metricLabel = t.metricLabel
    if (game.metricUnit) def.metricUnit = game.metricUnit
    if (game.metricLowerIsBetter) def.metricLowerIsBetter = game.metricLowerIsBetter
  }
  if (game.kind === 'quiz' && t.questions) def.questions = t.questions
  if (game.kind === 'estimate' && t.estimate) def.estimate = t.estimate
  if (game.kind === 'choice' && t.choice) def.choice = t.choice
  if (game.kind === 'ranking' && t.ranking) def.ranking = t.ranking
  if (game.kind === 'truefalse' && t.truefalse) def.truefalse = t.truefalse
  if (game.kind === 'match' && t.match) def.match = t.match
  return def
}

const PACKS: PresetPack[] = [
  {
    id: 'quiz-night',
    games: [
      {
        id: 'qn-gk-quiz',
        location: 'both',
        scoringType: 'points',
        kind: 'quiz',
        de: {
          title: 'Allgemeinwissen-Quiz',
          short: 'Fragerunde — der Host deckt die Antwort auf.',
          rules:
            'Der Host blättert durch die Fragen; wer zuerst richtig antwortet, punktet fürs Team.',
          questions: [
            { question: 'Hauptstadt von Australien?', answer: 'Canberra' },
            { question: 'Wie viele Kontinente gibt es?', answer: '7' },
            { question: 'Chemisches Symbol für Gold?', answer: 'Au' },
          ],
        },
        en: {
          title: 'General knowledge quiz',
          short: 'A quiz round — the host reveals the answer.',
          rules:
            'The host steps through the questions; whoever answers correctly first scores for their team.',
          questions: [
            { question: 'Capital of Australia?', answer: 'Canberra' },
            { question: 'How many continents are there?', answer: '7' },
            { question: 'Chemical symbol for gold?', answer: 'Au' },
          ],
        },
      },
      {
        id: 'qn-choice-planet',
        location: 'both',
        scoringType: 'points',
        kind: 'choice',
        de: {
          title: 'Multiple Choice: Planeten',
          short: 'Eine Frage, mehrere Antworten — nur eine ist richtig.',
          rules: 'Der Host zeigt die Optionen und deckt die richtige auf.',
          choice: {
            prompt: 'Welcher Planet ist der größte in unserem Sonnensystem?',
            options: ['Mars', 'Jupiter', 'Saturn', 'Erde'],
            correct: 1,
          },
        },
        en: {
          title: 'Multiple choice: planets',
          short: 'One question, several options — only one is right.',
          rules: 'The host shows the options and reveals the correct one.',
          choice: {
            prompt: 'Which planet is the largest in our solar system?',
            options: ['Mars', 'Jupiter', 'Saturn', 'Earth'],
            correct: 1,
          },
        },
      },
      {
        id: 'qn-estimate-eiffel',
        location: 'both',
        scoringType: 'measure',
        kind: 'estimate',
        de: {
          title: 'Schätzfrage: Eiffelturm',
          short: 'Beide Teams schätzen — näher an der Lösung gewinnt.',
          rules: 'Beide Teams geben eine Schätzung ab. Der Host deckt die Lösung auf.',
          estimate: { prompt: 'Wie hoch ist der Eiffelturm?', solution: '330', unit: 'm' },
        },
        en: {
          title: 'Estimate: Eiffel Tower',
          short: 'Both teams estimate — closest to the answer wins.',
          rules: 'Both teams give an estimate. The host reveals the answer.',
          estimate: { prompt: 'How tall is the Eiffel Tower?', solution: '330', unit: 'm' },
        },
      },
      {
        id: 'qn-ranking-planets',
        location: 'both',
        scoringType: 'points',
        kind: 'ranking',
        de: {
          title: 'Reihenfolge: Planeten',
          short: 'Planeten nach Größe ordnen.',
          rules:
            'Das Board zeigt die Planeten ungeordnet; die Teams bringen sie in die richtige Reihenfolge.',
          ranking: {
            prompt: 'Ordne diese Planeten nach Größe – der größte zuerst.',
            items: ['Jupiter', 'Saturn', 'Uranus', 'Neptun', 'Erde'],
          },
        },
        en: {
          title: 'Ordering: planets',
          short: 'Put the planets in order of size.',
          rules: 'The board shows the planets unordered; teams put them in the right order.',
          ranking: {
            prompt: 'Order these planets by size — the largest first.',
            items: ['Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Earth'],
          },
        },
      },
      {
        id: 'qn-truefalse-goldfish',
        location: 'both',
        scoringType: 'points',
        kind: 'truefalse',
        de: {
          title: 'Wahr oder Falsch: Goldfische',
          short: 'Eine Behauptung — wahr oder falsch?',
          rules: 'Der Host liest die Behauptung vor; die Teams tippen und der Host deckt auf.',
          truefalse: {
            statement: 'Goldfische haben ein Gedächtnis von nur drei Sekunden.',
            answer: false,
          },
        },
        en: {
          title: 'True or false: goldfish',
          short: 'A claim — true or false?',
          rules: 'The host reads the claim; teams guess and the host reveals.',
          truefalse: { statement: 'Goldfish have a memory of only three seconds.', answer: false },
        },
      },
      {
        id: 'qn-match-capitals',
        location: 'both',
        scoringType: 'points',
        kind: 'match',
        de: {
          title: 'Zuordnung: Hauptstädte',
          short: 'Länder ihren Hauptstädten zuordnen.',
          rules: 'Das Board zeigt zwei Spalten; die Teams ordnen zu und der Host deckt auf.',
          match: {
            prompt: 'Ordne jedes Land seiner Hauptstadt zu.',
            pairs: [
              { left: 'Frankreich', right: 'Paris' },
              { left: 'Japan', right: 'Tokio' },
              { left: 'Ägypten', right: 'Kairo' },
              { left: 'Kanada', right: 'Ottawa' },
            ],
          },
        },
        en: {
          title: 'Matching: capitals',
          short: 'Match countries to their capitals.',
          rules: 'The board shows two columns; teams match them and the host reveals.',
          match: {
            prompt: 'Match each country to its capital.',
            pairs: [
              { left: 'France', right: 'Paris' },
              { left: 'Japan', right: 'Tokyo' },
              { left: 'Egypt', right: 'Cairo' },
              { left: 'Canada', right: 'Ottawa' },
            ],
          },
        },
      },
    ],
  },
  {
    id: 'party',
    games: [
      {
        id: 'party-2-truths',
        location: 'both',
        scoringType: 'points',
        de: {
          title: '2 Wahrheiten, 1 Lüge',
          short: 'Das Team nennt Wahrheiten und eine Lüge — das andere errät sie.',
          rules:
            'Jedes Team nennt zwei Wahrheiten und eine Lüge über sich. Das andere Team errät die Lüge.',
          materials: 'Zettel & Stift',
        },
        en: {
          title: '2 truths, 1 lie',
          short: 'A team says truths and one lie — the other guesses it.',
          rules:
            'Each team states two truths and one lie about itself. The other team guesses the lie.',
          materials: 'Paper & pen',
        },
      },
      {
        id: 'party-tabu',
        location: 'both',
        scoringType: 'points',
        de: {
          title: 'Tabu',
          short: 'Begriff erklären, ohne die verbotenen Wörter zu sagen.',
          rules:
            'Ein Begriff wird erklärt, ohne bestimmte verbotene Wörter zu benutzen. Errät das Team den Begriff, gibt es einen Punkt.',
          materials: 'Begriffskarten (Begriff + Tabu-Wörter), Timer',
          hostNote: 'Beispiel: Begriff „Strand" | Tabu: Sand, Meer, Sonne, Urlaub',
        },
        en: {
          title: 'Taboo',
          short: 'Explain a word without saying the forbidden ones.',
          rules:
            'A word is explained without using certain forbidden words. If the team guesses it, they score a point.',
          materials: 'Word cards (word + taboo words), timer',
          hostNote: 'Example: word “beach” | taboo: sand, sea, sun, holiday',
        },
      },
      {
        id: 'party-emoji',
        location: 'both',
        scoringType: 'points',
        de: {
          title: 'Emoji-Rätsel',
          short: 'Film- oder Songtitel aus Emojis erraten.',
          rules: 'Aus einer Emoji-Folge den Film- oder Songtitel erraten. Mehr richtige gewinnt.',
          materials: 'Emoji-Karten oder Handy',
          hostNote: 'Beispiele: 🦁👑 = Der König der Löwen; ❄️⛄ = Die Eiskönigin',
        },
        en: {
          title: 'Emoji riddle',
          short: 'Guess a movie or song title from emojis.',
          rules: 'Guess the movie or song title from a string of emojis. Most correct wins.',
          materials: 'Emoji cards or a phone',
          hostNote: 'Examples: 🦁👑 = The Lion King; ❄️⛄ = Frozen',
        },
      },
      {
        id: 'party-charades',
        location: 'both',
        scoringType: 'points',
        de: {
          title: 'Pantomime',
          short: 'Begriffe nur mit Gestik darstellen — ohne Worte.',
          rules:
            'Ein Teammitglied stellt Begriffe nur mit Gestik dar, das eigene Team rät. Mehr Treffer gewinnt.',
          materials: 'Begriffskarten, Timer',
          hostNote: 'Ideen: Zähneputzen, Fahrradfahren, Pinguin, Gitarre spielen',
        },
        en: {
          title: 'Charades',
          short: 'Act out words with gestures only — no words.',
          rules:
            'One team member acts out words with gestures only; their team guesses. Most hits wins.',
          materials: 'Word cards, timer',
          hostNote: 'Ideas: brushing teeth, riding a bike, penguin, playing guitar',
        },
      },
    ],
  },
  {
    id: 'sport',
    games: [
      {
        id: 'sport-weitwurf',
        location: 'outdoor',
        scoringType: 'measure',
        tracksMetric: true,
        metricUnit: 'cm',
        de: {
          title: 'Dumme Sachen Weitwurf',
          short: 'Papiertaschentuch, Luftschlangen & Co. so weit wie möglich werfen.',
          rules: 'Alberne Gegenstände so weit wie möglich werfen. Die größte Weite gewinnt.',
          materials: 'Taschentücher, Luftschlangen …, Maßband',
          metricLabel: 'Weite',
        },
        en: {
          title: 'Silly things far-throw',
          short: 'Throw tissues, streamers & co. as far as you can.',
          rules: 'Throw silly objects as far as possible. The longest distance wins.',
          materials: 'Tissues, streamers …, tape measure',
          metricLabel: 'Distance',
        },
      },
      {
        id: 'sport-zielrollen',
        location: 'outdoor',
        scoringType: 'measure',
        tracksMetric: true,
        metricUnit: 'cm',
        metricLowerIsBetter: true,
        de: {
          title: 'Auf den Punkt rollen',
          short: 'Gegenstände möglichst genau auf einen Punkt rollen.',
          rules:
            'Gegenstände möglichst genau auf einen Zielpunkt rollen. Am nächsten dran gewinnt.',
          materials: 'Rollbare Gegenstände + Zielmarkierung',
          metricLabel: 'Abstand',
        },
        en: {
          title: 'Roll to the point',
          short: 'Roll objects as close to a target point as possible.',
          rules: 'Roll objects as accurately as possible toward a target. Closest wins.',
          materials: 'Rollable objects + a target marker',
          metricLabel: 'Distance',
        },
      },
      {
        id: 'sport-weltrekord',
        location: 'outdoor',
        scoringType: 'pass-fail',
        de: {
          title: 'Weltrekorde überbieten',
          short: 'Jede*r versucht, einen Weltrekord zu überbieten.',
          rules: 'Jedes Mitglied überbietet einen (machbaren) Weltrekord. Geschafft = bestanden.',
          materials: 'Maßband/Stoppuhr',
          hostNote: 'Disziplin-Ideen: Standweitsprung, 30-m-Sprint, Weitwurf',
        },
        en: {
          title: 'Beat world records',
          short: 'Everyone tries to beat a world record.',
          rules: 'Each member tries to beat a (doable) world record. Managed it = passed.',
          materials: 'Tape measure/stopwatch',
          hostNote: 'Discipline ideas: standing long jump, 30 m sprint, throwing distance',
        },
      },
      {
        id: 'sport-staffel',
        location: 'outdoor',
        scoringType: 'points',
        tracksMetric: true,
        metricUnit: 's',
        metricLowerIsBetter: true,
        de: {
          title: 'Staffellauf',
          short: 'Klassische Staffel — das schnellere Team gewinnt.',
          rules: 'Jedes Team läuft eine Staffel; die Gesamtzeit zählt. Schnellste Zeit gewinnt.',
          materials: 'Staffelstab, Stoppuhr',
          metricLabel: 'Gesamtzeit',
        },
        en: {
          title: 'Relay race',
          short: 'A classic relay — the faster team wins.',
          rules: 'Each team runs a relay; the total time counts. Fastest time wins.',
          materials: 'Relay baton, stopwatch',
          metricLabel: 'Total time',
        },
      },
    ],
  },
  {
    id: 'classic',
    games: [
      {
        id: 'classic-filme-zollstock',
        location: 'both',
        scoringType: 'versus',
        de: {
          title: 'Filme mit Zollstock',
          short: 'Ein Film wird mit dem Zollstock gelegt, das eigene Team rät.',
          rules:
            'Ein Teammitglied legt mit einem Zollstock einen Film, das eigene Team rät. Mehr erratene Filme gewinnt.',
          materials: 'Zollstock (Gliedermaßstab)',
          hostNote: 'Film-Ideen: Titanic, Der König der Löwen, Findet Nemo',
        },
        en: {
          title: 'Movies with a folding rule',
          short: 'A movie is shaped with a folding rule; your team guesses.',
          rules:
            'A team member shapes a movie with a folding rule; their team guesses. Most movies guessed wins.',
          materials: 'A folding rule',
          hostNote: 'Movie ideas: Titanic, The Lion King, Finding Nemo',
        },
      },
      {
        id: 'classic-aushalten',
        location: 'both',
        scoringType: 'stations',
        de: {
          title: 'Aushalten',
          short: 'Eine Aufgabe aushalten, bis sie fertig ist — 4 Stationen.',
          rules:
            'Einer macht eine Aufgabe, einer muss aushalten, bis sie fertig ist. Insgesamt 4 Stationen.',
          materials: '4 Stationen mit Aufgaben',
          hostNote: 'Ideen: Eiswürfel halten, Plank, Zitrone essen, Kitzeln aushalten',
        },
        en: {
          title: 'Endure it',
          short: 'Endure a task until it is finished — 4 stations.',
          rules:
            'One does a task, one must endure it until it is finished. Four stations in total.',
          materials: '4 stations with tasks',
          hostNote: 'Ideas: hold an ice cube, plank, eat a lemon, endure tickling',
        },
      },
      {
        id: 'classic-geruche',
        location: 'both',
        scoringType: 'points',
        de: {
          title: 'Gerüche erraten',
          short: 'Boxen mit verschiedenen Gerüchen erschnüffeln und erraten.',
          rules:
            'Boxen mit verschiedenen Gerüchen — erraten, was darin ist. Mehr richtige gewinnt.',
          materials: 'Blickdichte Boxen mit Duftproben',
          hostNote: 'Ideen: Kaffee, Zimt, Seife, Orange, Lavendel',
        },
        en: {
          title: 'Guess the smells',
          short: 'Sniff boxes with different smells and guess them.',
          rules: 'Boxes with different smells — guess what is inside. Most correct wins.',
          materials: 'Opaque boxes with scent samples',
          hostNote: 'Ideas: coffee, cinnamon, soap, orange, lavender',
        },
      },
      {
        id: 'classic-reaktionsduell',
        location: 'both',
        scoringType: 'versus',
        de: {
          title: 'Reaktionsduell',
          short: 'Auf das Signal zuerst reagieren — schnappen oder buzzern.',
          rules:
            'Auf ein vereinbartes Signal zuerst buzzern bzw. den Gegenstand schnappen. Wer öfter zuerst ist, gewinnt.',
          materials: 'Buzzer/Glocke oder ein greifbarer Gegenstand',
        },
        en: {
          title: 'Reaction duel',
          short: 'React first to the signal — grab or buzz.',
          rules:
            'On an agreed signal, buzz or grab the object first. Whoever is first more often wins.',
          materials: 'A buzzer/bell or a grabbable object',
        },
      },
    ],
  },
]

export const PRESET_PACKS: PresetPack[] = PACKS

/** Every valid preset pack id — the single source for the UI and server validation. */
export const PRESET_PACK_IDS: string[] = PACKS.map((p) => p.id)

// Game id → owning pack id. Preset ids are stable and disjoint across packs (and
// from the example seeds), so a game's pack can be recovered from its id alone —
// no marker is stored on the game itself.
const PACK_BY_GAME_ID = new Map<string, string>(
  PACKS.flatMap((pack) => pack.games.map((g): [string, string] => [g.id, pack.id])),
)

/** The preset pack a game belongs to (by id), or null for host-authored/example games. */
export function packOfGameId(id: string): string | null {
  return PACK_BY_GAME_ID.get(id) ?? null
}

/** The games of a preset pack, materialised for a locale (empty for an unknown id). */
export function presetGames(packId: string, locale: PresetLocale): GameDef[] {
  const pack = PACKS.find((p) => p.id === packId)
  return pack ? pack.games.map((g) => materialize(g, locale)) : []
}
