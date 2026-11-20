import { defineConfig, devices } from '@playwright/test'

/**
 * Layout checks on real engines (04e). Card clipping showed up only in iOS Safari,
 * so the default project is WebKit with an iPhone descriptor.
 * Run: npm run test:e2e   (starts `npm run dev` unless one is already on :5173)
 */
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173/Navi-Design-Task/',
  },
  projects: [
    { name: 'webkit-iphone', use: { ...devices['iPhone 15'], browserName: 'webkit' } },
    { name: 'chromium-iphone', use: { ...devices['iPhone 15'], browserName: 'chromium' } },
  ],
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: 'http://localhost:5173/Navi-Design-Task/',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
