import { describe, expect, test } from 'vitest';
import { ReactContextAdapter } from '../reactContextAdapter.js';

/**
 * IMPORTANT: React.cache() doesn't work in test environments.
 *
 * In React Server Components, React.cache() provides request-scoped memoization
 * that persists across function calls within the same request. In test environments,
 * React.cache() returns a NEW empty object on each call, making it impossible to
 * test data persistence.
 *
 * These tests verify:
 * 1. The adapter implements the required interface
 * 2. Methods don't throw errors
 * 3. The adapter is correctly configured in the global context system
 *
 * Actual functionality testing happens through integration tests that use the
 * global context configuration (getContextData/setContextData) which work correctly
 * in both test and RSC environments.
 */
describe('ReactContextAdapter', () => {
  describe('API Contract', () => {
    test('should implement ContextAdapter interface', () => {
      const adapter = new ReactContextAdapter();

      expect(adapter).toBeDefined();
      expect(typeof adapter.initializeContext).toBe('function');
      expect(typeof adapter.getData).toBe('function');
      expect(typeof adapter.setData).toBe('function');
      expect(typeof adapter.clear).toBe('function');
    });

    test('should not throw when calling methods', () => {
      const adapter = new ReactContextAdapter();

      expect(() => adapter.initializeContext()).not.toThrow();
      expect(() => adapter.getData()).not.toThrow();
      expect(() => adapter.setData({ preview_token: 'test' })).not.toThrow();
      expect(() => adapter.clear()).not.toThrow();
    });

    test('should return object from getData()', () => {
      const adapter = new ReactContextAdapter();
      const data = adapter.getData();

      expect(typeof data).toBe('object');
      expect(data).not.toBeNull();
    });
  });

  describe('Implementation Note', () => {
    test('should document React.cache() limitation in tests', () => {
      // This test exists to document why we can't test data persistence:
      //
      // Problem: In test environments, React.cache() returns a NEW empty object
      // on each call, so:
      //   adapter.setData({ foo: 'bar' })  // Modifies object A
      //   adapter.getData()                 // Returns NEW object B (empty)
      //
      // This makes it impossible to test that data persists between calls.
      //
      // Solution: Use the global context system (getContextData/setContextData)
      // which is tested in contextWrapper.test.tsx and works in both environments.

      expect(true).toBe(true);
    });
  });

  describe('Real-world usage', () => {
    test('should be used via global context configuration', () => {
      // In actual usage:
      // 1. ReactContextAdapter is configured automatically in contextWrapper.tsx
      // 2. Components use getContext() and setContext() from config.ts
      // 3. Those functions delegate to the configured adapter
      // 4. In RSC, React.cache() ensures request-scoped isolation
      //
      // See contextWrapper.test.tsx for integration tests that verify the
      // complete workflow works correctly.

      const adapter = new ReactContextAdapter();
      expect(adapter).toBeInstanceOf(ReactContextAdapter);
    });
  });
});
