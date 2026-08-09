import { describe, expect, it } from 'vitest'
import { isThemeId, nextTheme, THEME_IDS } from '../core/themes'

describe('isThemeId', () => {
  it('accepts known themes and rejects anything else', () => {
    expect(isThemeId('default')).toBe(true)
    expect(isThemeId('dark')).toBe(true)
    expect(isThemeId('neon')).toBe(true)
    expect(isThemeId('sepia')).toBe(false)
    expect(isThemeId('')).toBe(false)
  })
})

describe('nextTheme', () => {
  it('steps through the themes in order', () => {
    expect(nextTheme('default')).toBe('dark')
    expect(nextTheme('dark')).toBe('neon')
  })

  it('wraps back to the first after the last', () => {
    expect(nextTheme('neon')).toBe('default')
  })

  it('a full cycle returns to the start and visits every theme once', () => {
    const seen: string[] = []
    let t = THEME_IDS[0]!
    for (let i = 0; i < THEME_IDS.length; i++) {
      seen.push(t)
      t = nextTheme(t)
    }
    expect(seen).toEqual(THEME_IDS)
    expect(t).toBe(THEME_IDS[0])
  })
})
