import { describe, expect, it } from 'vitest'
import { isBuzzerComplete } from '../core/buzzer'

describe('isBuzzerComplete', () => {
  it('accepts a non-empty prompt (answer optional)', () => {
    expect(isBuzzerComplete({ prompt: 'Capital of Canada?', answer: 'Ottawa' })).toBe(true)
    expect(isBuzzerComplete({ prompt: 'Fastest land animal?', answer: '' })).toBe(true)
  })

  it('rejects a blank prompt', () => {
    expect(isBuzzerComplete({ prompt: '   ', answer: 'x' })).toBe(false)
    expect(isBuzzerComplete({ prompt: '', answer: '' })).toBe(false)
  })
})
