import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';
import {
  configureAdapter,
  getAdapter,
  getContext,
  getContextData,
  hasAdapter,
  initializeRequestContext,
  setContext,
  setContextData,
} from '../config.js';
import type { ContextAdapter } from '../baseContext.js';
import { MemoryAdapter } from '../../core/context/memoryAdapter.js';

const unconfigured = null as unknown as ContextAdapter;

describe('Context Configuration', () => {
  let adapter: MemoryAdapter;

  beforeEach(() => {
    adapter = new MemoryAdapter();
  });

  afterEach(() => configureAdapter(unconfigured));

  describe('configureAdapter()', () => {
    test('should allow adapter replacement', () => {
      const adapter1 = new MemoryAdapter();
      const adapter2 = new MemoryAdapter();

      configureAdapter(adapter1);
      expect(getAdapter()).toBe(adapter1);

      configureAdapter(adapter2);
      expect(getAdapter()).toBe(adapter2);
    });
  });

  describe('getAdapter()', () => {
    test('should return configured adapter', () => {
      configureAdapter(adapter);
      expect(getAdapter()).toBe(adapter);
    });

    test('should throw error when adapter not configured', () => {
      configureAdapter(unconfigured);

      expect(() => getAdapter()).toThrow('Context adapter not configured');
    });

    test('error message should provide helpful guidance', () => {
      configureAdapter(unconfigured);

      expect(() => getAdapter()).toThrow(/For React.*import from/);
      expect(() => getAdapter()).toThrow(/For other frameworks.*call configureAdapter/);
    });
  });

  describe('hasAdapter()', () => {
    test('reports false until an adapter is configured', () => {
      configureAdapter(unconfigured);
      expect(hasAdapter()).toBe(false);

      configureAdapter(adapter);
      expect(hasAdapter()).toBe(true);
    });
  });

  describe('initializeRequestContext()', () => {
    test('should call adapter initializeContext()', () => {
      const initSpy = vi.spyOn(adapter, 'initializeContext');
      configureAdapter(adapter);

      initializeRequestContext();

      expect(initSpy).toHaveBeenCalledOnce();
    });

    test('should clear existing context data', () => {
      configureAdapter(adapter);
      adapter.setData({ previewToken: 'test-token', locale: 'en' });

      initializeRequestContext();

      expect(adapter.getData()).toEqual({});
    });

    test('throws when no adapter is configured', () => {
      configureAdapter(unconfigured);

      expect(() => initializeRequestContext()).toThrow('Context adapter not configured');
    });
  });

  describe('getContext()', () => {
    test('should return data from adapter', () => {
      configureAdapter(adapter);
      adapter.setData({ previewToken: 'test-token' });

      expect(getContext()).toEqual({ previewToken: 'test-token' });
    });

    test('should return empty object when context is initialized but empty', () => {
      configureAdapter(adapter);
      adapter.initializeContext();

      expect(getContext()).toEqual({});
    });
  });

  describe('setContext()', () => {
    test('should set context data through adapter', () => {
      configureAdapter(adapter);

      setContext({ previewToken: 'test-token' });

      expect(adapter.getData()).toEqual({ previewToken: 'test-token' });
    });
  });

  describe('getContextData() / setContextData()', () => {
    test('setContextData writes a single key through the adapter', () => {
      configureAdapter(adapter);
      setContext({ locale: 'en' });

      setContextData('previewToken', 'token');

      expect(adapter.getData()).toEqual({ locale: 'en', previewToken: 'token' });
    });

    test('getContextData reads a single key and is undefined when unset', () => {
      configureAdapter(adapter);
      adapter.set('mode', 'edit');

      expect(getContextData('mode')).toBe('edit');
      expect(getContextData('locale')).toBeUndefined();
    });

    test('both throw when no adapter is configured', () => {
      configureAdapter(unconfigured);

      expect(() => getContextData('locale')).toThrow('Context adapter not configured');
      expect(() => setContextData('locale', 'en')).toThrow('Context adapter not configured');
    });
  });

  describe('Integration flow', () => {
    test('should support typical request lifecycle', () => {
      configureAdapter(adapter);

      initializeRequestContext();
      expect(getContext()).toEqual({});

      setContext({ previewToken: 'token123', locale: 'en' });
      expect(getContext()).toEqual({
        previewToken: 'token123',
        locale: 'en',
      });

      setContext({ key: 'page-key' });
      expect(getContext()).toEqual({
        previewToken: 'token123',
        locale: 'en',
        key: 'page-key',
      });

      initializeRequestContext();
      expect(getContext()).toEqual({});
    });
  });
});
