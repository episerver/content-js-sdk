import { afterEach, describe, expect, test, vi } from 'vitest';
import { ReactContextAdapter } from '../reactContextAdapter.js';
import {
  configureAdapter,
  getContext,
  getContextData,
  initializeRequestContext,
  setContext,
  setContextData,
} from '../../../context/config.js';

// Outside a server request React.cache does not memoise, so stand in for the per-request cache.
vi.mock('react', async importOriginal => ({
  ...(await importOriginal<typeof import('react')>()),
  cache: <T>(factory: () => T) => {
    const value = factory();
    return () => value;
  },
}));

describe('ReactContextAdapter', () => {
  afterEach(() => new ReactContextAdapter().clear());

  test('returns a value stored with set', () => {
    const adapter = new ReactContextAdapter();

    adapter.set('previewToken', 'token-123');

    expect(adapter.get('previewToken')).toBe('token-123');
    expect(adapter.get('locale')).toBeUndefined();
  });

  test('merges setData into the existing data', () => {
    const adapter = new ReactContextAdapter();

    adapter.set('locale', 'en');
    adapter.setData({ previewToken: 'token-123', mode: 'edit' });

    expect(adapter.getData()).toEqual({ locale: 'en', previewToken: 'token-123', mode: 'edit' });
  });

  test('initializeContext removes all stored data', () => {
    const adapter = new ReactContextAdapter();

    adapter.setData({ locale: 'en', previewToken: 'token-123' });
    adapter.initializeContext();

    expect(adapter.getData()).toEqual({});
  });

  test('clear removes all stored data', () => {
    const adapter = new ReactContextAdapter();

    adapter.setData({ locale: 'en', key: 'abc' });
    adapter.clear();

    expect(adapter.getData()).toEqual({});
  });

  test('instances share the same request-scoped data', () => {
    new ReactContextAdapter().set('locale', 'sv');

    expect(new ReactContextAdapter().get('locale')).toBe('sv');
  });

  test('backs the global context functions when configured', () => {
    configureAdapter(new ReactContextAdapter());

    setContextData('locale', 'de');
    setContext({ previewToken: 'token-456' });

    expect(getContextData('locale')).toBe('de');
    expect(getContext()).toEqual({ locale: 'de', previewToken: 'token-456' });

    initializeRequestContext();

    expect(getContext()).toEqual({});
  });
});
