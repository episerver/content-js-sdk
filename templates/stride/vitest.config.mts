import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/store/__tests__/**/*.test.ts'],
    env: {
      STRIDE_COOKIE_SECRET: 'vitest-secret-0123456789abcdef0123456789abcdef',
    },
  },
});
