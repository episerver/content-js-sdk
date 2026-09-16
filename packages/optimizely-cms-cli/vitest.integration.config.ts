import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/__integration__/**/*.integration.test.ts'],
    setupFiles: ['src/__integration__/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    retry: 1,
  },
});
