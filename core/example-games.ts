import type { GameDef } from './types'

/**
 * Editable example games shipped as seed data so a fresh tournament isn't empty.
 * The host can edit, reorder, remove or replace any of these — they are just a
 * starting point, not a fixed catalogue. `materials` and `hostNote` (questions /
 * content) are host-only prep. Text is German; example questions are placeholders
 * to adapt.
 */
export const EXAMPLE_GAMES: GameDef[] = [
  {
    id: 'filme-zollstock',
    title: 'Filme mit Zollstock',
    short: 'Ein Film wird mit dem Zollstock gelegt, das eigene Team rät.',
    rules:
      'Ein Teammitglied legt mit einem Zollstock einen Film, das eigene Team rät. ' +
      'Jedes Mitglied ist einmal dran. Das Team mit mehr erratenen Filmen gewinnt.',
    location: 'both',
    scoringType: 'versus',
    materials: 'Zollstock (Gliedermaßstab)',
    hostNote: 'Film-Ideen: Titanic, Der König der Löwen, Fluch der Karibik, Findet Nemo',
  },
  {
    id: 'aushalten',
    title: 'Aushalten',
    short: 'Eine Aufgabe aushalten, bis sie fertig ist — 4 Stationen.',
    rules:
      'Einer macht eine Aufgabe, einer muss aushalten, bis sie fertig ist. Insgesamt 4 Stationen.',
    location: 'both',
    scoringType: 'stations',
    materials: '4 Stationen mit Aufgaben',
    hostNote:
      'Stations-Ideen: Eiswürfel in der Hand halten, Unterarmstütz (Plank), ' +
      'Zitrone essen, Kitzeln aushalten',
  },
  {
    id: 'geschwindigkeit',
    title: 'Geschwindigkeit',
    short: 'Aufgaben auf Zeit — welches Team ist schneller? 4 Stationen.',
    rules: 'Aufgaben auf Zeit lösen — welches Team ist schneller? Insgesamt 4 Stationen.',
    location: 'both',
    scoringType: 'stations',
    tracksMetric: true,
    metricLabel: 'Gesamtzeit',
    metricUnit: 's',
    metricLowerIsBetter: true,
    materials: '4 Stationen + Stoppuhr',
    hostNote: 'Stations-Ideen: Becher stapeln, T-Shirt falten, Schuhe zubinden, Mini-Puzzle',
  },
  {
    id: 'wahrheit-luege',
    title: '2 Wahrheiten, 1 Lüge',
    short: 'Das Team nennt Wahrheiten und eine Lüge — das andere errät sie.',
    rules:
      'Jedes Team nennt zwei Wahrheiten und eine Lüge (oder umgekehrt). Das andere ' +
      'Team errät, was die Lüge ist.',
    location: 'both',
    scoringType: 'points',
    materials: 'Zettel & Stift für Ideen',
    hostNote: 'Jedes Team überlegt sich vorab 2 Wahrheiten und 1 Lüge über sich.',
  },
  {
    id: 'weltrekorde',
    title: 'Weltrekorde überbieten',
    short: 'Jede*r überbietet einen Weltrekord — vorab im Stadion gespielt.',
    rules:
      'Vorab im Stadion gespielt. Jedes Mitglied überbietet einen Weltrekord. Zwei ' +
      'Versuche dürfen addiert werden — aber nur, wenn beide zur selben Disziplin ' +
      'zählen (z. B. Weitsprung 2,15 m: Versuch 1,15 m + 0,90 m zählt nicht).',
    location: 'outdoor',
    scoringType: 'pass-fail',
    materials: 'Maßband/Stoppuhr (vorab im Stadion)',
    hostNote: 'Disziplin-Ideen: Standweitsprung, 30-m-Sprint, Weitwurf',
  },
  {
    id: 'quiz',
    title: 'Quiz',
    short: 'Fragerunde — die Frage steht auf dem Board, die Antwort deckt der Host auf.',
    rules:
      'Der Host blättert durch die Fragen; wer zuerst richtig antwortet, punktet ' +
      'fürs Team. Das Team mit den meisten richtigen Antworten gewinnt.',
    location: 'both',
    scoringType: 'points',
    kind: 'quiz',
    questions: [
      { question: 'Hauptstadt von Australien?', answer: 'Canberra' },
      { question: 'Wie viele Beine hat eine Spinne?', answer: '8' },
      { question: 'In welchem Jahr fiel die Berliner Mauer?', answer: '1989' },
    ],
  },
  {
    id: 'geruche',
    title: 'Gerüche erraten',
    short: 'Boxen mit verschiedenen Gerüchen erschnüffeln und erraten.',
    rules: 'Boxen mit verschiedenen Gerüchen — erraten, was darin ist.',
    location: 'both',
    scoringType: 'points',
    materials: 'Blickdichte Boxen mit Duftproben',
    hostNote: 'Ideen: Kaffee, Zimt, Seife, Orange, Knoblauch, Lavendel',
  },
  {
    id: 'ruecken-malen',
    title: 'Mit dem Rücken malen',
    short: 'Ein vorgegebenes Bild „mit dem Rücken" malen, die anderen raten.',
    rules:
      'Der Stift hängt an der Wand oder wird gehalten. Das Teammitglied hat Papier ' +
      'auf dem Rücken und malt ein vorgegebenes Bild. Danach raten die anderen, ' +
      'was es darstellt.',
    location: 'both',
    scoringType: 'points',
    materials: 'Papier, Stift, Klebeband/Wand',
    hostNote: 'Motive: Haus, Katze, Sonne, Fahrrad, Schneemann',
  },
  {
    id: 'was-soll-ich-machen',
    title: 'Was soll ich machen?',
    short: 'Hinter Glas: eine Aufgabe nur mit Gestik weitergeben.',
    rules:
      'Teammitglieder stehen hinter einem Fenster — sie sehen sich, hören sich aber ' +
      'nicht. Eine Seite bekommt eine Aufgabe, die die andere erfüllen muss — ' +
      'erklärt nur mit Gestik.',
    location: 'both',
    scoringType: 'points',
    materials: 'Fensterscheibe, Aufgabenkarten',
    hostNote: 'Aufgaben-Ideen: Kniebeugen, winken, tanzen, Grimasse schneiden',
  },
  {
    id: 'was-denkst-du',
    title: 'Was denkst du, was ich denke …',
    short: 'Bilder Personen zuordnen — so, wie das Teammitglied es tun würde.',
    rules:
      'Bilder werden Personen zugeordnet — und zwar so, wie man denkt, dass das ' +
      'Teammitglied die Bilder den Personen zuordnen würde.',
    location: 'both',
    scoringType: 'points',
    materials: 'Bilder + Zuordnungskarten',
    hostNote: 'Vorab Bilder und Personen vorbereiten.',
  },
  {
    id: 'rueckwarts-lieder',
    title: 'Rückwärts Lieder erkennen',
    short: 'Songs rückwärts erkennen — Einsatz aus dem Punkte-Pool.',
    rules:
      'Jedes Team hat einen Punkte-Pool (z. B. 10). Drei Lieder werden rückwärts ' +
      'gespielt. Vor jedem Lied wird gesetzt, wie viel Hörzeit man nimmt: ' +
      '10 Sek = 5 Punkte, 5 Sek = 3 Punkte, 2 Sek = 1 Punkt. Richtig erkannt = ' +
      'Einsatz als Punkte gutgeschrieben.',
    location: 'both',
    scoringType: 'betting',
    materials: 'Lieder rückwärts abspielbar, Box',
    hostNote: '3 bekannte Hits vorbereiten (rückwärts abspielbar).',
  },
  {
    id: 'dumme-sachen-weitwurf',
    title: 'Dumme Sachen Weitwurf',
    short: 'Papiertaschentuch, Luftschlangen & Co. so weit wie möglich werfen.',
    rules:
      'Alberne Gegenstände (Papiertaschentuch, Luftschlangen, …) so weit wie ' +
      'möglich werfen. Die größte Weite gewinnt.',
    location: 'outdoor',
    scoringType: 'measure',
    tracksMetric: true,
    metricLabel: 'Weite',
    metricUnit: 'cm',
    metricLowerIsBetter: false,
    materials: 'Taschentücher, Luftschlangen …, Maßband',
  },
  {
    id: 'filme-erfuhlen',
    title: 'Filme erfühlen',
    short: 'Mit verbundenen Augen Requisiten ertasten und den Film erraten.',
    rules:
      'Ein Teammitglied ertastet mit verbundenen Augen Requisiten, die das andere ' +
      'Teammitglied vorbereitet hat, und muss den Film erraten.',
    location: 'both',
    scoringType: 'points',
    materials: 'Requisiten + Augenbinde',
    hostNote: 'Pro Film passende Requisiten vorbereiten (z. B. Muschel = Findet Nemo).',
  },
  {
    id: 'aufgaben-schneller',
    title: 'Immer schneller',
    short: 'Eine Aufgaben-Kette — jede schneller als die davor.',
    rules:
      'Eine Kette von Aufgaben: Jede Aufgabe muss schneller erledigt werden als die vorherige.',
    location: 'both',
    scoringType: 'points',
    tracksMetric: true,
    metricLabel: 'Zeit',
    metricUnit: 's',
    metricLowerIsBetter: true,
    materials: 'Aufgabenkette + Stoppuhr',
    hostNote: '5 kleine Aufgaben nacheinander festlegen.',
  },
  {
    id: 'geheimsprache',
    title: 'Geheimsprache',
    short: 'Dinge mit Objekten tun und in einer Geheimsprache erklären.',
    rules:
      'Dinge mit Objekten tun und in einer erfundenen Geheimsprache erklären — die ' +
      'anderen müssen verstehen bzw. erraten, worum es geht.',
    location: 'both',
    scoringType: 'points',
    materials: 'Verschiedene Objekte',
  },
  {
    id: 'auf-punkt-rollen',
    title: 'Auf den Punkt rollen',
    short: 'Gegenstände möglichst genau auf einen Punkt / in eine Zone rollen.',
    rules:
      'Gegenstände möglichst genau auf einen bestimmten Punkt bzw. in eine Zone ' +
      'rollen. Am nächsten dran gewinnt.',
    location: 'both',
    scoringType: 'measure',
    tracksMetric: true,
    metricLabel: 'Abstand',
    metricUnit: 'cm',
    metricLowerIsBetter: true,
    materials: 'Rollbare Gegenstände + Zielmarkierung',
  },
  {
    id: 'schaetzfragen',
    title: 'Schätzfragen',
    short: 'Schätzfrage — welches Team liegt näher an der richtigen Zahl?',
    rules:
      'Pro Runde eine Schätzfrage („Wie viele …?"). Das Team, das näher an der ' +
      'richtigen Zahl liegt, gewinnt.',
    location: 'both',
    scoringType: 'measure',
    materials: 'Zettel & Stift',
    hostNote:
      'Fragen: 1) Wie viele Knochen hat ein Mensch? (206)  ' +
      '2) Höhe des Eiffelturms in m? (330)  3) Wie viele EU-Länder? (27)',
  },
  {
    id: 'zeitgefuehl',
    title: 'Zeitgefühl',
    short: 'Genau 30 Sekunden stoppen — ohne zu zählen. Näher dran gewinnt.',
    rules:
      'Ein Teammitglied startet und stoppt eine Stoppuhr und versucht, genau ' +
      '30 Sekunden zu treffen — ohne mitzuzählen. Kleinste Abweichung gewinnt.',
    location: 'both',
    scoringType: 'measure',
    materials: 'Stoppuhr (Anzeige verdecken)',
    hostNote: 'Zielzeit: 30 Sekunden.',
  },
  {
    id: 'geraeusche',
    title: 'Geräusche erraten',
    short: 'Alltags- und Tiergeräusche erraten.',
    rules: 'Geräusche werden abgespielt, die Teams erraten sie. Mehr richtige gewinnt.',
    location: 'both',
    scoringType: 'points',
    materials: 'Handy/Box mit Geräusch-Clips',
    hostNote: 'Ideen: Türklingel, miauende Katze, Motorrad, Popcorn, Regen',
  },
  {
    id: 'lippenlesen',
    title: 'Lippenlesen',
    short: 'Nur von den Lippen ablesen, was gesagt wird — ohne Ton.',
    rules:
      'Eine Person sagt lautlos (Ton wird übertönt) einen Satz oder Begriff, das ' +
      'eigene Team liest von den Lippen ab. Mehr Treffer gewinnt.',
    location: 'both',
    scoringType: 'points',
    materials: 'Kopfhörer + laute Musik zum Übertönen',
    hostNote: 'Sätze: Ich mag Pizza / Wo ist die Toilette? / Frohes neues Jahr',
  },
  {
    id: 'blind-verkosten',
    title: 'Blind verkosten',
    short: 'Mit verbundenen Augen erschmecken, was es ist.',
    rules:
      'Mit verbundenen Augen Lebensmittel erschmecken und erraten (nur vegetarisch/' +
      'vegan). Mehr richtige gewinnt.',
    location: 'both',
    scoringType: 'points',
    materials: 'Augenbinde, Kostproben (nur vegetarisch/vegan!), Wasser',
    hostNote: 'Ideen: Apfel, Gurke, Zitrone, Schokolade, Honig, Käse',
  },
  {
    id: 'emoji-raetsel',
    title: 'Emoji-Rätsel',
    short: 'Film- oder Songtitel aus Emojis erraten.',
    rules: 'Aus einer Emoji-Folge den Film- oder Songtitel erraten. Mehr richtige gewinnt.',
    location: 'both',
    scoringType: 'points',
    materials: 'Emoji-Karten oder Handy',
    hostNote: 'Beispiele: 🦁👑 = Der König der Löwen; ❄️⛄ = Die Eiskönigin; 🕷️🧑 = Spider-Man',
  },
  {
    id: 'reaktionsduell',
    title: 'Reaktionsduell',
    short: 'Auf das Signal zuerst reagieren — schnappen oder buzzern.',
    rules:
      'Auf ein vereinbartes Signal muss man zuerst buzzern bzw. den Gegenstand ' +
      'schnappen. Wer öfter zuerst ist, gewinnt.',
    location: 'both',
    scoringType: 'versus',
    materials: 'Buzzer/Glocke oder ein greifbarer Gegenstand',
  },
  {
    id: 'wer-hats-gesagt',
    title: "Wer hat's gesagt?",
    short: 'Zitate den richtigen Personen zuordnen.',
    rules:
      'Zitate werden vorgelesen; das Team ordnet sie den richtigen Personen zu. ' +
      'Mehr richtige gewinnt.',
    location: 'both',
    scoringType: 'points',
    materials: 'Zitatkarten',
    hostNote:
      'Beispiele: „Möge die Macht mit dir sein" (Star Wars); „Simsalabim" (Bibi Blocksberg)',
  },
  {
    id: 'tabu',
    title: 'Tabu',
    short: 'Begriff erklären, ohne die verbotenen Wörter zu sagen.',
    rules:
      'Ein Begriff wird erklärt, ohne bestimmte verbotene Wörter zu benutzen. ' +
      'Errät das eigene Team den Begriff, gibt es einen Punkt. Mehr Begriffe gewinnt.',
    location: 'both',
    scoringType: 'points',
    materials: 'Begriffskarten (Begriff + Tabu-Wörter), Sanduhr/Timer',
    hostNote: 'Beispiel: Begriff „Strand" | Tabu: Sand, Meer, Sonne, Urlaub',
  },
  {
    id: 'im-handumdrehen',
    title: 'Im Handumdrehen',
    short: 'Objekte auf dem Handrücken hochwerfen und wieder fangen — Finale.',
    rules:
      'Gegenstände (z. B. Stifte) auf den Handrücken legen, hochwerfen und mit ' +
      'derselben Hand wieder auffangen. Reihum, jede Runde ein Objekt mehr. Wer ' +
      'etwas fallen lässt, scheidet aus — der Letzte gewinnt. Als Finale zählen ' +
      'die im Turnier erspielten Punkte als Leben.',
    location: 'both',
    scoringType: 'final-lives',
    materials: 'Kleine Gegenstände (z. B. Stifte)',
  },
]

export const EXAMPLE_GAME_IDS = EXAMPLE_GAMES.map((g) => g.id)
