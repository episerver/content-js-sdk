import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'src/**/__tests__/**/*.ts'],
    typecheck: {
      include: ['src/**/*.test-d.ts'],
      tsconfig: './tsconfig.typecheck.json',
    },
    coverage: {
      reporter: ['text', 'html'],
    },
  },
});
