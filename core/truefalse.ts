// True/false helper: pure, framework-free, shared by the host editor and the
// config sanitizer.
import type { TrueFalseSpec } from './types'

/** Whether a true/false game is complete enough to save/play: it needs a statement. */
export function isTrueFalseComplete(spec: TrueFalseSpec): boolean {
  return spec.statement.trim().length > 0
}
