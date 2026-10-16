/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Scoped to src/ so the compiled tests are never collected.
    include: ['src/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
  },
});
