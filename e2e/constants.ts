// Shared e2e config so the Playwright config and the specs never drift apart.
export const E2E_PORT = 3123
export const E2E_BASE_URL = `http://localhost:${E2E_PORT}`

// The web server is started with NUXT_HOST_PIN set to this, so the specs unlock
// the host with the same value.
export const HOST_PIN = '1909'

// An isolated state file (via SPIELWIESE_STATE_FILE) so the e2e run never
// clobbers a running dev server's data/state.json.
export const E2E_STATE_FILE = 'data/e2e-state.json'
