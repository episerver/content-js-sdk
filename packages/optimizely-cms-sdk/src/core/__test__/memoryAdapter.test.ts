import { AsyncLocalStorage } from 'node:async_hooks';
import { describe, expect, test } from 'vitest';
import { MemoryAdapter } from '../context/memoryAdapter.js';
import type { ContextData } from '../../context/baseContext.js';

describe('MemoryAdapter', () => {
  test('set, get and setData share one context outside any run', () => {
    const adapter = new MemoryAdapter();

    adapter.set('locale', 'en');
    adapter.setData({ previewToken: 'token' });

    expect(adapter.get('locale')).toBe('en');
    expect(adapter.getData()).toEqual({ locale: 'en', previewToken: 'token' });
  });

  test('initializeContext and clear empty the current context', () => {
    const adapter = new MemoryAdapter();

    adapter.set('locale', 'en');
    adapter.initializeContext();
    expect(adapter.getData()).toEqual({});

    adapter.set('key', 'abc');
    adapter.clear();
    expect(adapter.getData()).toEqual({});
  });

  test('run gives fn a context of its own and restores the outer one', () => {
    const adapter = new MemoryAdapter();
    adapter.set('locale', 'en');

    const inner = adapter.run(() => {
      adapter.set('locale', 'sv');
      return adapter.get('locale');
    });

    expect(inner).toBe('sv');
    expect(adapter.get('locale')).toBe('en');
  });

  test('with AsyncLocalStorage, concurrent runs do not see each other', async () => {
    const adapter = new MemoryAdapter(new AsyncLocalStorage<ContextData>());
    const tick = () => new Promise(resolve => setTimeout(resolve, 0));

    const handle = (locale: string) =>
      adapter.run(async () => {
        adapter.set('locale', locale);
        await tick();
        return adapter.get('locale');
      });

    expect(await Promise.all([handle('en'), handle('sv')])).toEqual(['en', 'sv']);
  });
});
