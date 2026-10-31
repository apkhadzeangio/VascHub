import { defineConfig } from '@playwright/test'
import 'dotenv/config'
import path from 'node:path'
process.env.DIRECTORY_TESTS = '1'

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.e2e.spec.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 15000 },
  outputDir: path.resolve('test-results/directory'),
  reporter: [
    ['list'],
    ['json', { outputFile: path.resolve('test-results/directory-results.json') }],
  ],
  use: {
    baseURL: 'http://localhost:3105',
    browserName: 'chromium',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--use-gl=angle',
        '--use-angle=swiftshader',
        '--enable-unsafe-swiftshader',
      ],
    },
  },
  webServer: {
    command: process.env.DIRECTORY_SERVER_COMMAND || 'pnpm dev --hostname 127.0.0.1 --port 3105',
    url: 'http://localhost:3105/specialists',
    reuseExistingServer: false,
    timeout: 180000,
  },
})
