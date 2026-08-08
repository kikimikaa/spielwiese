import { describe, expect, it } from 'vitest'
import { PRESET_PACKS, PRESET_PACK_IDS, presetGames, type PresetLocale } from '../core/presets'
import { buildConfig, parseConfig } from '../core/config'

const LOCALES: PresetLocale[] = ['de', 'en']

describe('presetGames', () => {
  it('returns nothing for an unknown pack', () => {
    expect(presetGames('does-not-exist', 'de')).toEqual([])
  })

  it('materialises language-specific text but keeps the same ids', () => {
    const de = presetGames('quiz-night', 'de')
    const en = presetGames('quiz-night', 'en')
    expect(de.length).toBeGreaterThan(0)
    expect(en.map((g) => g.id)).toEqual(de.map((g) => g.id))
    // Same games, different language → titles differ.
    expect(en[0]?.title).not.toBe(de[0]?.title)
  })

  it('carries type-specific content for the active locale', () => {
    const en = presetGames('quiz-night', 'en')
    const choice = en.find((g) => g.kind === 'choice')
    expect(choice?.choice?.options).toContain('Earth')
    const ranking = en.find((g) => g.kind === 'ranking')
    expect(ranking?.ranking?.items[0]).toBe('Jupiter')
  })

  it('has unique game ids within every pack', () => {
    for (const pack of PRESET_PACKS) {
      const ids = pack.games.map((g) => g.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })
})

describe('preset config safety', () => {
  // Every preset game, in every language, must survive the config parser — the
  // same guard the reverted #7 shipped, so a malformed preset can never load.
  it('round-trips every pack through the config parser', () => {
    for (const packId of PRESET_PACK_IDS) {
      for (const locale of LOCALES) {
        const games = presetGames(packId, locale)
        const result = parseConfig(buildConfig('T', '2026-01-01', games))
        expect(result.ok, `${packId}/${locale}`).toBe(true)
        if (result.ok) expect(result.config.games.length).toBe(games.length)
      }
    }
  })
})
