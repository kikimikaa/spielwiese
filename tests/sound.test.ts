import { describe, expect, it } from 'vitest'
import {
  A4_HZ,
  COUNTDOWN_CUE,
  cueDuration,
  DRUMROLL_CUE,
  FANFARE_CUE,
  noteHz,
  TEAM_JINGLES,
  teamJingle,
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
    for (const cue of [WIN_CUE, FANFARE_CUE, COUNTDOWN_CUE, DRUMROLL_CUE, ...TEAM_JINGLES]) {
      expect(cue.length).toBeGreaterThan(0)
      expect(cueDuration(cue)).toBeGreaterThan(0)
    }
  })
})

describe('teamJingle', () => {
  it('returns a distinct jingle per team position', () => {
    expect(teamJingle(0)).toBe(TEAM_JINGLES[0])
    expect(teamJingle(1)).toBe(TEAM_JINGLES[1])
    expect(teamJingle(0)).not.toEqual(teamJingle(1))
  })

  it('wraps around when there are more teams than jingles', () => {
    expect(teamJingle(TEAM_JINGLES.length)).toBe(TEAM_JINGLES[0])
    expect(teamJingle(TEAM_JINGLES.length + 1)).toBe(TEAM_JINGLES[1])
  })

  it('never returns empty for any index', () => {
    for (const i of [0, 1, 2, 3, 7, 99]) {
      expect(teamJingle(i).length).toBeGreaterThan(0)
    }
  })
})
