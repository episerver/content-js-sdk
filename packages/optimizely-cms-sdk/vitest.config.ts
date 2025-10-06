/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
  esbuild: {
    jsx: 'automatic',
  },
  resolve: {
    alias: {
      // Handle .js imports in TypeScript files
      '~/': new URL('./src/', import.meta.url).pathname,
    },
  },
});
