import { defineConfig, devices } from '@playwright/test'
import { E2E_BASE_URL, E2E_PORT, E2E_STATE_FILE, HOST_PIN } from './e2e/constants'

const CI = Boolean(process.env['CI'])

export default defineConfig({
  testDir: './e2e',
  // The tests share one server-side tournament, so they run serially.
  fullyParallel: false,
  workers: 1,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: E2E_BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // A production build is stable under browser load (the dev server isn't) and
    // is what actually ships. `pnpm test:e2e` builds first; this just runs it.
    command: 'pnpm start',
    url: E2E_BASE_URL,
    reuseExistingServer: !CI,
    timeout: 120_000,
    env: {
      PORT: String(E2E_PORT),
      NUXT_HOST_PIN: HOST_PIN,
      SPIELWIESE_STATE_FILE: E2E_STATE_FILE,
    },
  },
})
