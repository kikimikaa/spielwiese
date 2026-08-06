import { describe, expect, it } from 'vitest'
import de from '../i18n/locales/de.json'
import en from '../i18n/locales/en.json'

/** Collects every leaf key path so DE and EN must stay in lockstep. */
function keyPaths(obj: unknown, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) return [prefix]
  return Object.entries(obj).flatMap(([k, v]) => keyPaths(v, prefix ? `${prefix}.${k}` : k))
}

describe('i18n parity', () => {
  it('de and en have identical key sets', () => {
    const deKeys = keyPaths(de).sort()
    const enKeys = keyPaths(en).sort()
    expect(enKeys).toEqual(deKeys)
  })
})
