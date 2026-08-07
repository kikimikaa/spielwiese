import type { GameDef } from './types'

/**
 * Ready-made game libraries the host can load as a starting point instead of
 * building one from scratch. Like EXAMPLE_GAMES, the game text is plain
 * host-authored data (German) — only the template's UI label is translated, via
 * `host.template.<id>`. Applying a template swaps the whole game library, so each
 * template's game ids must be unique (guarded by a unit test).
 */
export interface GameTemplate {
  id: string
  games: GameDef[]
}

export const GAME_TEMPLATES: GameTemplate[] = [
  {
    id: 'quiz',
    games: [
      {
        id: 'quiz-allgemein',
        title: 'Allgemeinwissen',
        short: 'Fragen quer durch alle Themen — welches Team weiß mehr?',
        rules:
          'Der Host stellt Fragen abwechselnd an beide Teams. Richtige Antwort = ein Punkt fürs Team. Das Team mit mehr richtigen Antworten gewinnt die Runde.',
        location: 'indoor',
        scoringType: 'versus',
        hostNote: 'Fragen-Ideen: Hauptstädte, Jahreszahlen, Sport, Wissenschaft.',
      },
      {
        id: 'quiz-musik',
        title: 'Musik-Quiz',
        short: 'Song am Intro erkennen.',
        rules:
          'Ein kurzer Ausschnitt wird abgespielt, das schnellere Team ruft Titel oder Interpret. Wer mehr errät, gewinnt.',
        location: 'indoor',
        scoringType: 'versus',
        materials: 'Lautsprecher, Playlist',
      },
      {
        id: 'quiz-film',
        title: 'Film-Zitate',
        short: 'Aus welchem Film stammt das Zitat?',
        rules: 'Der Host liest ein Zitat vor, die Teams raten den Film. Mehr Treffer gewinnt.',
        location: 'indoor',
        scoringType: 'versus',
      },
      {
        id: 'quiz-schaetz',
        title: 'Schätzfragen',
        short: 'Wer kommt am nächsten dran?',
        rules:
          'Beide Teams schätzen bei einer Zahlenfrage. Das Team mit der näheren Schätzung bekommt den Punkt.',
        location: 'indoor',
        scoringType: 'points',
        hostNote: 'Ideen: Höhe eines Bauwerks, Einwohnerzahl, Gewicht eines Tiers.',
      },
    ],
  },
  {
    id: 'sports',
    games: [
      {
        id: 'sport-staffel',
        title: 'Staffellauf',
        short: 'Team-Staffel auf Zeit.',
        rules: 'Jedes Team läuft die Staffel, die Gesamtzeit zählt. Das schnellere Team gewinnt.',
        location: 'outdoor',
        scoringType: 'measure',
        tracksMetric: true,
        metricLabel: 'Gesamtzeit',
        metricUnit: 's',
        metricLowerIsBetter: true,
        materials: 'Staffelstab, Stoppuhr',
      },
      {
        id: 'sport-weitwurf',
        title: 'Weitwurf',
        short: 'Wer wirft am weitesten?',
        rules: 'Jedes Teammitglied wirft einmal, die weiteste Weite des Teams zählt.',
        location: 'outdoor',
        scoringType: 'measure',
        tracksMetric: true,
        metricLabel: 'Weite',
        metricUnit: 'm',
        materials: 'Ball oder Wurfscheibe, Maßband',
      },
      {
        id: 'sport-sackhuepfen',
        title: 'Sackhüpfen',
        short: 'Hüpfrennen im Sack.',
        rules: 'Beide Teams treten im Sackhüpf-Rennen an. Das erste Team im Ziel gewinnt.',
        location: 'outdoor',
        scoringType: 'versus',
        materials: 'Jutesäcke',
      },
      {
        id: 'sport-tauziehen',
        title: 'Tauziehen',
        short: 'Klassisches Kräftemessen.',
        rules: 'Beide Teams ziehen am Tau. Wer die andere Seite über die Linie zieht, gewinnt.',
        location: 'outdoor',
        scoringType: 'versus',
        materials: 'Tau, Markierung',
      },
    ],
  },
  {
    id: 'office',
    games: [
      {
        id: 'office-stuhlrennen',
        title: 'Bürostuhl-Rennen',
        short: 'Rennen auf dem Bürostuhl.',
        rules: 'Jedes Team rollt den Parcours auf dem Bürostuhl ab, die Gesamtzeit zählt.',
        location: 'indoor',
        scoringType: 'measure',
        tracksMetric: true,
        metricLabel: 'Gesamtzeit',
        metricUnit: 's',
        metricLowerIsBetter: true,
        materials: 'Bürostuhl, Hütchen, Stoppuhr',
      },
      {
        id: 'office-kabelsalat',
        title: 'Kabelsalat',
        short: 'Verknotete Kabel auf Zeit entwirren.',
        rules: 'Beide Teams entwirren einen Kabelsalat, das schnellere Team gewinnt.',
        location: 'indoor',
        scoringType: 'measure',
        tracksMetric: true,
        metricLabel: 'Zeit',
        metricUnit: 's',
        metricLowerIsBetter: true,
        materials: 'Ein paar verknotete Kabel',
      },
      {
        id: 'office-papierflieger',
        title: 'Papierflieger-Weitflug',
        short: 'Wessen Flieger fliegt am weitesten?',
        rules: 'Jedes Team baut und wirft einen Papierflieger, die weiteste Distanz zählt.',
        location: 'indoor',
        scoringType: 'measure',
        tracksMetric: true,
        metricLabel: 'Weite',
        metricUnit: 'm',
        materials: 'Papier, Maßband',
      },
      {
        id: 'office-schaetz',
        title: 'Büroklammer-Schätzen',
        short: 'Wie viele Büroklammern sind im Glas?',
        rules: 'Beide Teams schätzen die Anzahl. Die nähere Schätzung bekommt den Punkt.',
        location: 'indoor',
        scoringType: 'points',
        materials: 'Glas mit Büroklammern',
      },
    ],
  },
]
