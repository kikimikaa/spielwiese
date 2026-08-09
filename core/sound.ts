// Board sound cues, synthesised in the browser (no audio files) so the app stays
// self-contained and works offline. This module is pure note data + helpers; the
// actual Web Audio playback lives in the useSound composable.

/** Concert-pitch reference: A4 = 440 Hz, the 0-point for our semitone offsets. */
export const A4_HZ = 440

/** Equal-temperament frequency of a note `semitones` away from A4. */
export function noteHz(semitones: number): number {
  return A4_HZ * 2 ** (semitones / 12)
}

/** One note of a cue: pitch (semitones from A4), start offset and length, in seconds. */
export interface CueNote {
  semitones: number
  at: number
  dur: number
}

// A quick rising two-note chime when a team wins a game (E5 → A5).
export const WIN_CUE: CueNote[] = [
  { semitones: 7, at: 0, dur: 0.12 },
  { semitones: 12, at: 0.09, dur: 0.2 },
]

// Short per-team signature jingles, played right after the win chime so each
// team's win sounds a little different. Picked by the team's position, wrapping
// if there are more teams than jingles — so no team is ever silent.
export const TEAM_JINGLES: CueNote[][] = [
  [
    { semitones: 0, at: 0, dur: 0.12 },
    { semitones: 7, at: 0.12, dur: 0.12 },
    { semitones: 12, at: 0.24, dur: 0.22 },
  ],
  [
    { semitones: 5, at: 0, dur: 0.12 },
    { semitones: 2, at: 0.12, dur: 0.12 },
    { semitones: -3, at: 0.24, dur: 0.22 },
  ],
  [
    { semitones: 3, at: 0, dur: 0.1 },
    { semitones: 3, at: 0.12, dur: 0.1 },
    { semitones: 10, at: 0.24, dur: 0.24 },
  ],
  [
    { semitones: -5, at: 0, dur: 0.12 },
    { semitones: 0, at: 0.14, dur: 0.12 },
    { semitones: 5, at: 0.28, dur: 0.22 },
  ],
]

/** The signature jingle for the team at play-order `index` (wraps around). */
export function teamJingle(index: number): CueNote[] {
  const n = TEAM_JINGLES.length
  return TEAM_JINGLES[((index % n) + n) % n] ?? []
}

// A short triumphant arpeggio for the ceremony (A major up to the octave).
export const FANFARE_CUE: CueNote[] = [
  { semitones: 0, at: 0, dur: 0.16 },
  { semitones: 4, at: 0.16, dur: 0.16 },
  { semitones: 7, at: 0.32, dur: 0.16 },
  { semitones: 12, at: 0.48, dur: 0.45 },
]

// Three even beeps and a higher "go" — a get-ready countdown when a game starts.
export const COUNTDOWN_CUE: CueNote[] = [
  { semitones: 0, at: 0, dur: 0.14 },
  { semitones: 0, at: 0.4, dur: 0.14 },
  { semitones: 0, at: 0.8, dur: 0.14 },
  { semitones: 7, at: 1.2, dur: 0.35 },
]

// A fast roll of soft low taps building into a hit — a drumroll into the reveal.
const ROLL_TAPS = 14
const ROLL_STEP = 0.05
export const DRUMROLL_CUE: CueNote[] = [
  ...Array.from({ length: ROLL_TAPS }, (_, i) => ({
    semitones: -12,
    at: i * ROLL_STEP,
    dur: ROLL_STEP,
  })),
  { semitones: 0, at: ROLL_TAPS * ROLL_STEP, dur: 0.3 },
]

/** Total length of a cue in seconds — the end of its latest note. */
export function cueDuration(cue: CueNote[]): number {
  return cue.reduce((end, n) => Math.max(end, n.at + n.dur), 0)
}
