import { defineConfig, devices } from '@playwright/test'

// A dedicated port + state file so the e2e server never clashes with, or clobbers
// the state of, a dev server you might have running.
const PORT = 3123
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  // The tests share one server-side tournament, so they run serially.
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // A production build is stable under browser load (the dev server isn't) and
    // is what actually ships. `pnpm test:e2e` builds first; this just runs it.
    command: 'pnpm start',
    url: BASE_URL,
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
    env: {
      PORT: String(PORT),
      NUXT_HOST_PIN: '1909',
      SPIELWIESE_STATE_FILE: 'data/e2e-state.json',
    },
  },
})
