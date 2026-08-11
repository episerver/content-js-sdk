import { defineConfig } from '@playwright/test';

/**
 * ADR 0002 enforcement suite (issue 0002 deliverable 4).
 *
 * Parameterized by BASE_URL — run against any integrated deployment:
 *   BASE_URL=https://localhost:3000 npm run test:webmcp
 *
 * PENDING INTEGRATION: requires the issue-0001 store (app routes,
 * /api/store/*, StoreProvider bridge + test hooks documented in
 * docs/storefront-v2/integration-notes-0002.md). Authored against the
 * frozen contracts; it does not run standalone.
 */
export default defineConfig({
  testDir: '.',
  timeout: 30_000,
  fullyParallel: false,
  workers: 1, // cart/session state is cookie-scoped per context; keep runs deterministic
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    ignoreHTTPSErrors: true, // next dev --experimental-https uses a self-signed cert
  },
});
