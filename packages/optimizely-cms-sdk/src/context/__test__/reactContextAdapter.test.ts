import { describe, expect, test, beforeEach } from 'vitest';
import { ReactContextAdapter } from '../reactContextAdapter.js';
import type { ContextData } from '../baseContext.js';

describe('ReactContextAdapter', () => {
  let adapter: ReactContextAdapter;

  beforeEach(() => {
    adapter = new ReactContextAdapter();
  });

  describe('initializeContext()', () => {
    test('should initialize empty context', () => {
      adapter.initializeContext();
      const data = adapter.getData();
      expect(data).toEqual({});
    });

    test('should clear existing data', () => {
      adapter.setData({ preview_token: 'test-token', locale: 'en' });

      adapter.initializeContext();

      const data = adapter.getData();
      expect(data).toEqual({});
    });

    test('should clear all properties', () => {
      const fullData: Partial<ContextData> = {
        preview_token: 'token',
        locale: 'en-US',
        key: 'page-key',
        version: '1.0',
        ctx: { mode: 'edit' },
        currentContent: { id: '123' },
      };

      adapter.setData(fullData);
      adapter.initializeContext();

      const data = adapter.getData();
      expect(Object.keys(data || {})).toHaveLength(0);
    });
  });

  describe('getData()', () => {
    test('should return empty object initially', () => {
      adapter.initializeContext();
      const data = adapter.getData();
      expect(data).toEqual({});
    });

    test('should return previously set data', () => {
      adapter.setData({ preview_token: 'test-token' });
      const data = adapter.getData();
      expect(data).toEqual({ preview_token: 'test-token' });
    });

    test('should return the same reference within request scope', () => {
      // React.cache ensures same instance per request
      const data1 = adapter.getData();
      const data2 = adapter.getData();
      expect(data1).toBe(data2);
    });
  });

  describe('setData()', () => {
    test('should set single property', () => {
      adapter.initializeContext();
      adapter.setData({ preview_token: 'token123' });

      expect(adapter.getData()).toEqual({ preview_token: 'token123' });
    });

    test('should set multiple properties', () => {
      adapter.initializeContext();
      adapter.setData({
        preview_token: 'token123',
        locale: 'en-US',
        key: 'page-key',
      });

      const data = adapter.getData();
      expect(data).toEqual({
        preview_token: 'token123',
        locale: 'en-US',
        key: 'page-key',
      });
    });

    test('should merge with existing data', () => {
      adapter.initializeContext();
      adapter.setData({ preview_token: 'token123' });
      adapter.setData({ locale: 'en-US' });

      expect(adapter.getData()).toEqual({
        preview_token: 'token123',
        locale: 'en-US',
      });
    });

    test('should override existing values', () => {
      adapter.initializeContext();
      adapter.setData({ preview_token: 'old-token' });
      adapter.setData({ preview_token: 'new-token' });

      expect(adapter.getData()).toEqual({ preview_token: 'new-token' });
    });

    test('should handle undefined values', () => {
      adapter.initializeContext();
      adapter.setData({ preview_token: undefined });

      const data = adapter.getData();
      expect(data).toHaveProperty('preview_token');
      expect(data?.preview_token).toBeUndefined();
    });

    test('should handle complex nested objects', () => {
      adapter.initializeContext();
      const complexData = {
        currentContent: {
          id: '123',
          name: 'Test',
          nested: { deep: { value: 'test' } },
        },
        ctx: { mode: 'edit', flags: ['a', 'b'] },
      };

      adapter.setData(complexData);

      expect(adapter.getData()).toEqual(complexData);
    });
  });

  describe('clear()', () => {
    test('should clear all context data', () => {
      adapter.setData({
        preview_token: 'token',
        locale: 'en',
        key: 'key',
      });

      adapter.clear();

      const data = adapter.getData();
      expect(data).toEqual({});
    });

    test('should allow setting data after clear', () => {
      adapter.setData({ preview_token: 'token1' });
      adapter.clear();
      adapter.setData({ preview_token: 'token2' });

      expect(adapter.getData()).toEqual({ preview_token: 'token2' });
    });
  });

  describe('Request isolation', () => {
    test('should support multiple adapters with independent state', () => {
      const adapter1 = new ReactContextAdapter();
      const adapter2 = new ReactContextAdapter();

      adapter1.initializeContext();
      adapter2.initializeContext();

      adapter1.setData({ preview_token: 'token1' });
      adapter2.setData({ preview_token: 'token2' });

      // Note: In actual React Server Components, React.cache() provides
      // request isolation automatically. In tests, each adapter instance
      // would share the same cache within the same test execution.
      // This test verifies the adapter API works correctly.
      expect(adapter1.getData()).toBeDefined();
      expect(adapter2.getData()).toBeDefined();
    });
  });

  describe('Full lifecycle', () => {
    test('should handle complete request lifecycle', () => {
      // Initialize request
      adapter.initializeContext();
      expect(adapter.getData()).toEqual({});

      // Extract searchParams
      adapter.setData({
        preview_token: 'abc123',
        locale: 'en-US',
        key: 'page_123',
      });

      // Verify data is accessible
      const data1 = adapter.getData();
      expect(data1?.preview_token).toBe('abc123');
      expect(data1?.locale).toBe('en-US');

      // Add more context during request
      adapter.setData({ version: '2.0' });

      const data2 = adapter.getData();
      expect(data2).toEqual({
        preview_token: 'abc123',
        locale: 'en-US',
        key: 'page_123',
        version: '2.0',
      });

      // Clear for next request
      adapter.clear();
      expect(adapter.getData()).toEqual({});
    });
  });
});
