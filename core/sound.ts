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

// A short triumphant arpeggio for the ceremony (A major up to the octave).
export const FANFARE_CUE: CueNote[] = [
  { semitones: 0, at: 0, dur: 0.16 },
  { semitones: 4, at: 0.16, dur: 0.16 },
  { semitones: 7, at: 0.32, dur: 0.16 },
  { semitones: 12, at: 0.48, dur: 0.45 },
]

/** Total length of a cue in seconds — the end of its latest note. */
export function cueDuration(cue: CueNote[]): number {
  return cue.reduce((end, n) => Math.max(end, n.at + n.dur), 0)
}
