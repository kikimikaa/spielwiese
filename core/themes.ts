// Board colour themes: a small set of palettes selected via a `data-theme`
// attribute on <html> (each maps to a token override block in main.css). Pure
// and framework-free so the selection logic is unit-testable.

export type ThemeId = 'default' | 'dark' | 'neon'

/** Every theme, in the order the board's cycle button steps through them. */
export const THEME_IDS: ThemeId[] = ['default', 'dark', 'neon']

export function isThemeId(value: string): value is ThemeId {
  return (THEME_IDS as string[]).includes(value)
}

/** The next theme in the cycle, wrapping back to the first after the last. */
export function nextTheme(current: ThemeId): ThemeId {
  const i = THEME_IDS.indexOf(current)
  return THEME_IDS[(i + 1) % THEME_IDS.length] ?? 'default'
}
