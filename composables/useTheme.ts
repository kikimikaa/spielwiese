import { isThemeId, nextTheme, type ThemeId } from '../core/themes'

/** Selects the board colour theme via `data-theme` on <html>, persisted per device. */
export function useTheme() {
  const theme = useCookie<ThemeId>('spielwiese-theme', {
    default: () => 'default',
    sameSite: 'lax',
  })

  const current = () => (isThemeId(theme.value) ? theme.value : 'default')

  const apply = () => {
    if (import.meta.client) document.documentElement.setAttribute('data-theme', current())
  }

  onMounted(apply)
  watch(theme, apply)

  const cycle = () => {
    theme.value = nextTheme(current())
  }

  return { theme, cycle }
}
