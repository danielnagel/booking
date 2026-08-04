import { defineConfig, devices } from '@playwright/test';

// The full stack (db, backend, frontend/nginx) is expected to already be up
// via `docker compose up -d` at the repo root - see global-setup.js, which
// only waits for it to become reachable instead of starting/stopping it.
// The frontend's nginx serves the app and proxies /api on the same origin
// (see frontend/nginx.conf), which the httpOnly/SameSite=Strict auth cookie
// relies on, so tests must go through that origin rather than hitting the
// backend container's port directly.
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  globalSetup: './global-setup.js',
  timeout: 30_000,
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
