/**
 * A framework-neutral {@linkcode ContextAdapter}, for hosts that have no
 * request-scoped storage of their own to hand the SDK.
 *
 * @module
 */

import type { ContextAdapter, ContextData } from '../../context/baseContext.js';

/**
 * The part of Node's `AsyncLocalStorage` this adapter uses.
 *
 * Declared structurally rather than imported so the browser build never has to
 * resolve `node:async_hooks`.
 */
export type AsyncContextStorage = {
  getStore(): ContextData | undefined;
  run<T>(store: ContextData, fn: () => T): T;
};

/** A single shared context. Correct in a browser, and on a host serving one request at a time. */
function createSharedStorage(): AsyncContextStorage {
  let shared: ContextData | undefined;

  return {
    getStore: () => shared,
    // Not restored afterwards: a synchronous restore would drop the context at an async `fn`'s first `await`
    run(store, fn) {
      shared = store;
      return fn();
    },
  };
}

/**
 * Stores context data in memory.
 *
 * A server handling concurrent requests must pass an `AsyncLocalStorage`, or all
 * of them will share one context:
 *
 * @example
 * ```ts
 * import { AsyncLocalStorage } from 'node:async_hooks';
 * import { configureAdapter, MemoryAdapter } from '@optimizely/cms-sdk/core';
 *
 * const adapter = new MemoryAdapter(new AsyncLocalStorage());
 * configureAdapter(adapter);
 *
 * // then, per request:
 * await adapter.run(() => handleRequest(request));
 * ```
 */
export class MemoryAdapter implements ContextAdapter {
  private storage: AsyncContextStorage;
  private fallback: ContextData = {};

  constructor(storage: AsyncContextStorage = createSharedStorage()) {
    this.storage = storage;
  }

  /** The store for this request, or a process-wide one outside any {@linkcode run}. */
  private current(): ContextData {
    return this.storage.getStore() ?? this.fallback;
  }

  /** Runs `fn` with a context of its own. Wrap a request handler in this. */
  run<T>(fn: () => T): T {
    return this.storage.run({}, fn);
  }

  initializeContext(): void {
    const data = this.current();
    Object.keys(data).forEach(key => delete data[key as keyof ContextData]);
  }

  set<K extends keyof ContextData>(key: K, value: ContextData[K]): void {
    this.current()[key] = value;
  }

  get<K extends keyof ContextData>(key: K): ContextData[K] | undefined {
    return this.current()[key];
  }

  getData(): ContextData | undefined {
    return this.current();
  }

  setData(value: Partial<ContextData>): void {
    Object.assign(this.current(), value);
  }

  clear(): void {
    this.initializeContext();
  }
}
