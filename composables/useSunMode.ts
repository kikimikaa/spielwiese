/** Toggles the high-contrast `.sun` mode on <html>, persisted per device. */
export function useSunMode() {
  const enabled = useCookie<boolean>('spielwiese-sun', { default: () => false, sameSite: 'lax' })

  const apply = () => {
    if (import.meta.client) document.documentElement.classList.toggle('sun', enabled.value)
  }

  onMounted(apply)
  watch(enabled, apply)

  const toggle = () => {
    enabled.value = !enabled.value
  }

  return { enabled, toggle }
}
