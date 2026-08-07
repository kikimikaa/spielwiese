import type { ConfigError } from '../core/config'
import { buildConfig, configFileName, parseConfig, serializeConfig } from '../core/config'

/** Import failure: a parse error, or a generic failure (file read / server). */
export type ImportError = ConfigError | 'failed'

/** Triggers a browser download of `text` as a named file. */
function downloadFile(text: string, filename: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  // Revoke on the next tick — revoking synchronously can cancel the download in
  // browsers that start it asynchronously after the click.
  setTimeout(() => URL.revokeObjectURL(url))
}

/**
 * Host-side export/import of the reusable tournament config. Export runs fully in
 * the browser (download); import reads the chosen file, validates it with the
 * shared parser and — only if valid — sends it to the server, which re-validates
 * before applying. `importError` holds the last failure for the UI to show.
 */
export function useConfigTransfer() {
  const { command } = useHost()
  const { state, games } = useTournamentState()
  const importError = ref<ImportError | null>(null)

  function exportConfig(): void {
    const s = state.value
    if (!s) return
    const config = buildConfig(s.name, s.date, games.value)
    downloadFile(serializeConfig(config), configFileName(s.name))
  }

  async function importFromFile(file: File): Promise<boolean> {
    importError.value = null
    let text: string
    try {
      text = await file.text()
    } catch {
      importError.value = 'failed'
      return false
    }
    const result = parseConfig(text)
    if (!result.ok) {
      importError.value = result.error
      return false
    }
    try {
      await command('importConfig', { config: result.config })
    } catch {
      // Server re-validation rejected it, or the request failed — surface it
      // instead of leaving the host with a silently unchanged library.
      importError.value = 'failed'
      return false
    }
    return true
  }

  return { exportConfig, importFromFile, importError }
}
