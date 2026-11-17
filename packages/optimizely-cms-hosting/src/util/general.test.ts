import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  deserialize,
  log,
  normalizePath,
  secretsMatch,
  serialize,
  toPath,
  unique,
  withTimeout,
} from './general.js';

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('serialize / deserialize', () => {
  it('round-trips the Buffers and Maps of a cached App Router page', () => {
    const page = {
      kind: 'APP_PAGE',
      html: '<html></html>',
      rscData: Buffer.from('rsc payload'),
      segmentData: new Map([['/_tree', Buffer.from('segment')]]),
      headers: { 'x-next-cache-tags': '_N_T_/en' },
    };

    const restored = deserialize<typeof page>(serialize(page));

    expect(restored).toEqual(page);
    expect(Buffer.isBuffer(restored.rscData)).toBe(true);
    expect(restored.segmentData).toBeInstanceOf(Map);
    expect(Buffer.isBuffer(restored.segmentData.get('/_tree'))).toBe(true);
  });

  it('leaves plain JSON unchanged', () => {
    const value = { a: 1, b: ['x', null], c: { d: true } };

    expect(serialize(value)).toBe(JSON.stringify(value));
    expect(deserialize(serialize(value))).toEqual(value);
  });
});

describe('paths', () => {
  it.each([
    ['/en/news/', '/en/news'],
    ['/', '/'],
    ['', '/'],
  ])('normalizePath(%j) is %j', (path, expected) => {
    expect(normalizePath(path)).toBe(expected);
  });

  it.each([
    ['en/news/', '/en/news'],
    ['/en/news', '/en/news'],
    ['https://www.mysite.com/en/news/', '/en/news'],
    ['https://www.mysite.com', '/'],
    ['', '/'],
  ])('toPath(%j) is %j', (value, expected) => {
    expect(toPath(value)).toBe(expected);
  });

  it('keeps the first of each item in order', () => {
    expect(unique(['/b', '/a', '/b'])).toEqual(['/b', '/a']);
  });
});

describe('secretsMatch', () => {
  it.each([
    ['callback-key', 'callback-key', true],
    ['callback-kez', 'callback-key', false],
    ['callback-key-2', 'callback-key', false],
    ['', 'callback-key', false],
    ['key-🔑', 'key-🔑', true],
    ['key-🔒', 'key-🔑', false],
  ])('compares %s with %s as %s', (provided, expected, matches) => {
    expect(secretsMatch(provided, expected)).toBe(matches);
  });
});

describe('withTimeout', () => {
  it('resolves with the promise when it settles in time', async () => {
    await expect(withTimeout(Promise.resolve('done'), 1000, 'Task')).resolves.toBe(
      'done',
    );
  });

  it('rejects with the operation name after the timeout', async () => {
    vi.useFakeTimers();
    const pending = withTimeout(new Promise(() => {}), 10_000, 'Redis connection');
    const assertion = expect(pending).rejects.toThrow(
      'Redis connection timed out after 10s',
    );

    await vi.advanceTimersByTimeAsync(10_000);
    await assertion;
  });
});

describe('log', () => {
  it('prefixes messages and prints only the error message', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});

    log.warn('Redis unavailable', new Error('refused'));
    log.info('Purge accepted');

    expect(warn).toHaveBeenCalledWith('[cms-hosting] Redis unavailable:', 'refused');
    expect(info).toHaveBeenCalledWith('[cms-hosting] Purge accepted');
  });
});
