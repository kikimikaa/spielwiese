import { describe, expect, it } from 'vitest'
import { isChoiceComplete, MIN_CHOICE_OPTIONS, optionLetter } from '../core/choice'
import type { ChoiceSpec } from '../core/types'

const choice = (over: Partial<ChoiceSpec> = {}): ChoiceSpec => ({
  prompt: 'Largest planet?',
  options: ['Mars', 'Jupiter'],
  correct: 1,
  ...over,
})

describe('optionLetter', () => {
  it('labels options A, B, C …', () => {
    expect(optionLetter(0)).toBe('A')
    expect(optionLetter(1)).toBe('B')
    expect(optionLetter(3)).toBe('D')
  })
})

describe('isChoiceComplete', () => {
  it('accepts a prompt with at least two options and a valid correct index', () => {
    expect(isChoiceComplete(choice())).toBe(true)
  })

  it('needs the minimum number of options', () => {
    expect(isChoiceComplete(choice({ options: ['Only one'], correct: 0 }))).toBe(false)
    expect(choice().options.length).toBeGreaterThanOrEqual(MIN_CHOICE_OPTIONS)
  })

  it('rejects a blank prompt', () => {
    expect(isChoiceComplete(choice({ prompt: '   ' }))).toBe(false)
  })

  it('rejects a correct index out of range', () => {
    expect(isChoiceComplete(choice({ correct: 2 }))).toBe(false)
    expect(isChoiceComplete(choice({ correct: -1 }))).toBe(false)
  })
})
