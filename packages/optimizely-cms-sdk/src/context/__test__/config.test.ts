import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';
import {
  configureAdapter,
  getAdapter,
  getContext,
  setContext,
  initializeRequestContext,
} from '../config.js';
import type { ContextAdapter, ContextData } from '../baseContext.js';

describe('Context Configuration', () => {
  // Mock adapter for testing
  class MockAdapter implements ContextAdapter {
    private data: ContextData = {};

    initializeContext(): void {
      this.data = {};
    }

    getData(): ContextData | undefined {
      return this.data;
    }

    setData(value: Partial<ContextData>): void {
      Object.assign(this.data, value);
    }

    set<K extends keyof ContextData>(key: K, value: ContextData[K]): void {
      this.data[key] = value;
    }

    get<K extends keyof ContextData>(key: K): ContextData[K] | undefined {
      return this.data[key];
    }

    clear(): void {
      this.data = {};
    }
  }

  let mockAdapter: MockAdapter;

  beforeEach(() => {
    mockAdapter = new MockAdapter();
  });

  describe('configureAdapter()', () => {
    test('should set the storage adapter', () => {
      configureAdapter(mockAdapter);
      expect(getAdapter()).toBe(mockAdapter);
    });

    test('should allow adapter replacement', () => {
      const adapter1 = new MockAdapter();
      const adapter2 = new MockAdapter();

      configureAdapter(adapter1);
      expect(getAdapter()).toBe(adapter1);

      configureAdapter(adapter2);
      expect(getAdapter()).toBe(adapter2);
    });
  });

  describe('getAdapter()', () => {
    afterEach(() => {
      // Restore valid adapter after tests that set it to null
      configureAdapter(mockAdapter);
    });

    test('should return configured adapter', () => {
      configureAdapter(mockAdapter);
      const adapter = getAdapter();
      expect(adapter).toBe(mockAdapter);
    });

    test('should throw error when adapter not configured', () => {
      // Reset adapter to simulate unconfigured state
      configureAdapter(null as unknown as MockAdapter);

      expect(() => getAdapter()).toThrow(
        'Context adapter not configured',
      );
    });

    test('error message should provide helpful guidance', () => {
      configureAdapter(null as unknown as MockAdapter);

      expect(() => getAdapter()).toThrow(/For React.*import from/);
      expect(() => getAdapter()).toThrow(/For other frameworks.*call configureAdapter/);
    });
  });

  describe('initializeRequestContext()', () => {
    test('should call adapter initializeContext()', () => {
      const initSpy = vi.spyOn(mockAdapter, 'initializeContext');
      configureAdapter(mockAdapter);

      initializeRequestContext();

      expect(initSpy).toHaveBeenCalledOnce();
    });

    test('should clear existing context data', () => {
      configureAdapter(mockAdapter);
      mockAdapter.setData({ previewToken: 'test-token', locale: 'en' });

      initializeRequestContext();

      const data = mockAdapter.getData();
      expect(data).toEqual({});
    });
  });

  describe('getContext()', () => {
    test('should return data from adapter', () => {
      configureAdapter(mockAdapter);
      mockAdapter.setData({ previewToken: 'test-token' });

      const data = getContext();

      expect(data).toEqual({ previewToken: 'test-token' });
    });

    test('should return empty object when context is initialized but empty', () => {
      configureAdapter(mockAdapter);
      mockAdapter.initializeContext();

      const data = getContext();

      expect(data).toEqual({});
    });
  });

  describe('setContext()', () => {
    test('should set context data through adapter', () => {
      configureAdapter(mockAdapter);

      setContext({ previewToken: 'test-token' });

      expect(mockAdapter.getData()).toEqual({ previewToken: 'test-token' });
    });

    test('should merge with existing data', () => {
      configureAdapter(mockAdapter);
      mockAdapter.setData({ previewToken: 'token1' });

      setContext({ locale: 'en' });

      expect(mockAdapter.getData()).toEqual({
        previewToken: 'token1',
        locale: 'en',
      });
    });

    test('should override existing values', () => {
      configureAdapter(mockAdapter);
      mockAdapter.setData({ previewToken: 'old-token' });

      setContext({ previewToken: 'new-token' });

      expect(mockAdapter.getData()).toEqual({ previewToken: 'new-token' });
    });

    test('should handle all ContextData properties', () => {
      configureAdapter(mockAdapter);

      const fullContext: Partial<ContextData> = {
        version: '1.0',
        currentContent: { id: '123' },
        previewToken: 'token',
        mode: 'edit',
        locale: 'en-US',
        key: 'content-key',
      };

      setContext(fullContext);

      expect(mockAdapter.getData()).toEqual(fullContext);
    });
  });

  describe('Integration flow', () => {
    test('should support typical request lifecycle', () => {
      configureAdapter(mockAdapter);

      // Initialize request
      initializeRequestContext();
      expect(getContext()).toEqual({});

      // Set initial data
      setContext({ previewToken: 'token123', locale: 'en' });
      expect(getContext()).toEqual({
        previewToken: 'token123',
        locale: 'en',
      });

      // Add more data
      setContext({ key: 'page-key' });
      expect(getContext()).toEqual({
        previewToken: 'token123',
        locale: 'en',
        key: 'page-key',
      });

      // Initialize new request (clears data)
      initializeRequestContext();
      expect(getContext()).toEqual({});
    });
  });
});
