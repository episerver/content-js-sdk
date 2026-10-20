import { describe, expect, test, vi } from 'vitest';
import { createStore } from '../store.js';

describe('createStore', () => {
  test('setState publishes a new snapshot and notifies subscribers', () => {
    const store = createStore({ count: 0 });
    const listener = vi.fn();
    store.subscribe(listener);

    store.setState(state => ({ ...state, count: 1 }));

    expect(store.getSnapshot()).toEqual({ count: 1 });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test('a shallowly equal state keeps the snapshot and notifies nobody', () => {
    const store = createStore({ count: 0, label: 'a' });
    const listener = vi.fn();
    store.subscribe(listener);
    const before = store.getSnapshot();

    store.setState(state => ({ ...state }));

    expect(store.getSnapshot()).toBe(before);
    expect(listener).not.toHaveBeenCalled();
  });

  test('a nested object with a new identity counts as a change', () => {
    const store = createStore({ items: [1] });
    const listener = vi.fn();
    store.subscribe(listener);

    store.setState(() => ({ items: [1] }));

    expect(listener).toHaveBeenCalledTimes(1);
  });

  test('an added key counts as a change', () => {
    const store = createStore<{ a: number; b?: number }>({ a: 1 });
    const listener = vi.fn();
    store.subscribe(listener);

    store.setState(state => ({ ...state, b: undefined }));

    expect(listener).toHaveBeenCalledTimes(1);
  });

  test('unsubscribing stops notifications', () => {
    const store = createStore({ count: 0 });
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    unsubscribe();
    store.setState(state => ({ ...state, count: 1 }));

    expect(listener).not.toHaveBeenCalled();
  });
});
