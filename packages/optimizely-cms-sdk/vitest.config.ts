/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    // Scoped to src/ because vitest 5 dropped `**/dist/**` from its default
    // exclude list, so the compiled tests under dist/cjs and dist/esm would
    // otherwise be collected and run alongside the sources.
    include: ['src/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    typecheck: {
      include: ['src/**/*.{test,spec}-d.?(c|m)[jt]s?(x)'],
    },
  },
  resolve: {
    alias: {
      // Handle .js imports in TypeScript files
      '~/': new URL('./src/', import.meta.url).pathname,
    },
  },
});
