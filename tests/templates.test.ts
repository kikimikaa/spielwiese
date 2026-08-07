import { describe, expect, it } from 'vitest'
import { GAME_TEMPLATES } from '../core/templates'
import { buildConfig, parseConfig } from '../core/config'

describe('GAME_TEMPLATES', () => {
  it('has unique template ids', () => {
    const ids = GAME_TEMPLATES.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it.each(GAME_TEMPLATES.map((t) => [t.id, t] as const))(
    'template "%s" is a non-empty, importable config',
    (_id, template) => {
      expect(template.games.length).toBeGreaterThan(0)
      // Round-trip through the shared parser: this rejects duplicate game ids,
      // empty titles, unknown locations/scoring types, etc. — so a bad template
      // can never ship.
      const result = parseConfig(buildConfig('Test', '2026-01-01', template.games))
      expect(result.ok).toBe(true)
    },
  )
})
