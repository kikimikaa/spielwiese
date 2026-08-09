// Buzzer-game helper: pure, framework-free, shared by the host editor, the board
// display and the config sanitizer.
import type { BuzzerSpec } from './types'

/** Whether a buzzer question is complete enough to save/play: it needs a prompt. */
export function isBuzzerComplete(spec: BuzzerSpec): boolean {
  return spec.prompt.trim().length > 0
}
