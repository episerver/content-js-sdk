/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    exclude: ['node_modules/**', 'dist/**', 'src/**/__integration__/**'],
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
