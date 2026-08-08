// Multiple-choice helpers: pure, framework-free, shared by the host editor, the
// board display and the config sanitizer.
import type { ChoiceSpec } from './types'

/** Char code of 'A' — options are labelled A, B, C … on the board and in the editor. */
const LETTER_A = 65

/** The letter shown before the option at `index` (0 → 'A', 1 → 'B', …). */
export function optionLetter(index: number): string {
  return String.fromCharCode(LETTER_A + index)
}

/** A multiple-choice question needs at least this many options to make sense. */
export const MIN_CHOICE_OPTIONS = 2

/** Whether a choice is complete enough to save/play: a prompt, ≥2 options, a valid correct index. */
export function isChoiceComplete(spec: ChoiceSpec): boolean {
  return (
    spec.prompt.trim().length > 0 &&
    spec.options.length >= MIN_CHOICE_OPTIONS &&
    spec.correct >= 0 &&
    spec.correct < spec.options.length
  )
}
