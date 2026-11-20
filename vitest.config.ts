import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    // e2e/ holds Playwright specs (npm run test:e2e), not Vitest
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
  },
})
