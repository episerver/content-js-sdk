/**
 * A minimal observable store, the primitive every stateful part of the core layer
 * is built on.
 *
 * The `subscribe` / `getSnapshot` pair is deliberately the shape React's
 * `useSyncExternalStore` expects, and adapts to a Svelte store or an Angular signal.
 *
 * @module
 */

/** Read-only view of a {@linkcode Store}, handed to consumers that only observe. */
export type ReadableStore<T> = {
  getSnapshot(): T;
  subscribe(listener: () => void): () => void;
};

export type Store<T> = ReadableStore<T> & {
  /**
   * Replaces the state. Returning the current state (or an equal one) is a no-op:
   * no new snapshot is produced and no listener runs.
   */
  setState(update: (current: T) => T): void;
};

const shallowEqual = <T extends object>(a: T, b: T): boolean => {
  const keys = Object.keys(a) as (keyof T)[];
  return (
    keys.length === Object.keys(b).length && keys.every(key => Object.is(a[key], b[key]))
  );
};

/**
 * Creates a store holding `initial`.
 *
 * The snapshot keeps its identity until the state actually changes, which is what
 * stops `useSyncExternalStore` from looping.
 */
export function createStore<T extends object>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<() => void>();

  return {
    getSnapshot: () => state,

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    setState(update) {
      const next = update(state);
      if (shallowEqual(state, next)) return;

      state = next;
      listeners.forEach(listener => listener());
    },
  };
}
