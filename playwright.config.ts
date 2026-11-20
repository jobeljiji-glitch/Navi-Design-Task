import { defineConfig, devices } from '@playwright/test'

/** E2E_PORT lets the suite use a fresh dev server when :5173 is busy with an older one. */
const PORT = process.env.E2E_PORT ?? '5173'

/**
 * Layout checks on real engines (04e). Card clipping showed up only in iOS Safari,
 * so the default project is WebKit with an iPhone descriptor.
 * Run: npm run test:e2e   (starts `npm run dev` unless one is already on :5173)
 */
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  fullyParallel: false,
  // 09: one dev server serves both engines; more than 2 workers made layout timing flaky under load
  workers: 2,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}/Navi-Design-Task/`,
  },
  projects: [
    { name: 'webkit-iphone', use: { ...devices['iPhone 15'], browserName: 'webkit' } },
    { name: 'chromium-iphone', use: { ...devices['iPhone 15'], browserName: 'chromium' } },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/Navi-Design-Task/`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
