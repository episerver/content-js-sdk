import { defineConfig } from '@playwright/test';

/**
 * Gate G1 — direct-tool suite (issue 0003 work item 1).
 *
 * Executes every tool step of the three benchmark workflows via direct
 * callTool (≙ the Inspector's Run Tool control) with dual-output asserted
 * at promise resolution. Pass bar: 100%, no tolerance (PRD §4).
 *
 *   npm run build && npm run start -- -p 3210
 *   BASE_URL=http://localhost:3210 npm run test:g1
 */
export default defineConfig({
  testDir: '.',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1, // cookie-scoped cart/session state; deterministic runs
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    ignoreHTTPSErrors: true,
  },
});
