import { defineConfig, devices } from '@playwright/test'
import 'dotenv/config'

/**
 * Dedicated config for the Events & Training section so it never shares the default port (3000)
 * or build directory with any other work. Run with:
 *   pnpm build && pnpm exec playwright test --config tests/e2e/events/playwright.events.config.ts
 * (NEXT_PUBLIC_SERVER_URL must be http://localhost:3104 when building.)
 */
const PORT = Number(process.env.EVENTS_E2E_PORT || 3104)

export default defineConfig({
  testDir: '.',
  testMatch: '*.e2e.spec.ts',
  outputDir: '../../../test-results/events',
  reporter: [['list']],
  workers: 1,
  forbidOnly: !!process.env.CI,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], channel: 'chromium' } }],
  webServer: {
    command: process.env.E2E_SERVER_COMMAND || `pnpm start -p ${PORT}`,
    url: `http://localhost:${PORT}/events`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
