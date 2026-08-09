import { describe, expect, it } from 'vitest'
import {
  A4_HZ,
  COUNTDOWN_CUE,
  cueDuration,
  DRUMROLL_CUE,
  FANFARE_CUE,
  noteHz,
  WIN_CUE,
} from '../core/sound'

describe('noteHz', () => {
  it('returns the reference pitch at 0 semitones', () => {
    expect(noteHz(0)).toBe(A4_HZ)
  })

  it('doubles up an octave and halves down an octave', () => {
    expect(noteHz(12)).toBeCloseTo(A4_HZ * 2)
    expect(noteHz(-12)).toBeCloseTo(A4_HZ / 2)
  })

  it('is monotonic across a semitone', () => {
    expect(noteHz(7)).toBeGreaterThan(noteHz(6))
  })
})

describe('cueDuration', () => {
  it('is the end of the latest note, not just the sum', () => {
    // Overlapping notes: total length is the furthest (at + dur), here 0.3.
    expect(
      cueDuration([
        { semitones: 0, at: 0, dur: 0.2 },
        { semitones: 4, at: 0.1, dur: 0.2 },
      ]),
    ).toBeCloseTo(0.3)
  })

  it('is 0 for an empty cue', () => {
    expect(cueDuration([])).toBe(0)
  })

  it('the shipped cues are non-empty and have positive length', () => {
    for (const cue of [WIN_CUE, FANFARE_CUE, COUNTDOWN_CUE, DRUMROLL_CUE]) {
      expect(cue.length).toBeGreaterThan(0)
      expect(cueDuration(cue)).toBeGreaterThan(0)
    }
  })
})
