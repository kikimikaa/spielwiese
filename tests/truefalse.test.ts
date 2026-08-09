import { describe, expect, it } from 'vitest'
import { isTrueFalseComplete } from '../core/truefalse'

describe('isTrueFalseComplete', () => {
  it('accepts a non-empty statement, either answer', () => {
    expect(isTrueFalseComplete({ statement: 'An octopus has three hearts.', answer: true })).toBe(
      true,
    )
    expect(isTrueFalseComplete({ statement: 'The sun is cold.', answer: false })).toBe(true)
  })

  it('rejects a blank statement', () => {
    expect(isTrueFalseComplete({ statement: '   ', answer: true })).toBe(false)
    expect(isTrueFalseComplete({ statement: '', answer: false })).toBe(false)
  })
})
