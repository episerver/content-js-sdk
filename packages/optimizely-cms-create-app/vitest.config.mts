import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // `build` copies every template in the registry into ./templates/ so they
    // can be published with the package. Those trees are payload, not this
    // package's tests: they carry their own vitest/playwright setup, deps and
    // env, and running them from here fails on missing packages and unset
    // template env vars. Each template's suite runs from its own workspace.
    exclude: ['**/node_modules/**', '**/dist/**', 'templates/**'],
  },
});
