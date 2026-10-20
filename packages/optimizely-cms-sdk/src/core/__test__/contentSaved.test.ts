import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  createContentSavedListener,
  type ContentSavedEvent,
  type ContentSavedListenerOptions,
} from '../preview/contentSaved.js';

const EVENT_NAME = 'optimizely:cms:contentSaved';

const save = (overrides: Partial<ContentSavedEvent> = {}) =>
  window.dispatchEvent(
    new CustomEvent(EVENT_NAME, {
      detail: {
        contentLink: 'content-1',
        previewUrl: 'http://localhost:3000/about',
        previewToken: 'token',
        ...overrides,
      },
    }),
  );

/** Starts a listener and tears it down when the test ends. */
const listen = (options: ContentSavedListenerOptions) => {
  const listener = createContentSavedListener(options);
  const stop = listener.start();
  cleanups.push(stop);
  return listener;
};

let cleanups: (() => void)[] = [];

beforeEach(() => {
  vi.useFakeTimers();
  window.history.replaceState({}, '', '/');
});

afterEach(() => {
  cleanups.forEach(stop => stop());
  cleanups = [];
  vi.useRealTimers();
});

describe('debouncing', () => {
  test('the burst of events one save emits coalesces into a single navigation', () => {
    const onNavigate = vi.fn();
    listen({ onNavigate });

    save();
    save();
    save();
    vi.advanceTimersByTime(50);

    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  test('nothing happens before the timeout elapses', () => {
    const onNavigate = vi.fn();
    listen({ onNavigate, refreshTimeout: 200 });

    save();
    vi.advanceTimersByTime(199);
    expect(onNavigate).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  test('refreshTimeout false navigates at once, and guards against the repeat', () => {
    const onNavigate = vi.fn();
    listen({ onNavigate, refreshTimeout: false });

    save();
    save();

    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  test('the dupe guard is per content item', () => {
    const onNavigate = vi.fn();
    listen({ onNavigate, refreshTimeout: false });

    save({ contentLink: 'content-1' });
    save({ contentLink: 'content-2' });

    expect(onNavigate).toHaveBeenCalledTimes(2);
  });
});

describe('the target URL', () => {
  test('saving the page being viewed is reported as a refresh', () => {
    const onNavigate = vi.fn();
    listen({ onNavigate });

    window.history.replaceState({}, '', '/about');
    save({ previewUrl: 'http://localhost:3000/about/' });
    vi.advanceTimersByTime(50);

    // A trailing slash is not a different page.
    expect(onNavigate).toHaveBeenCalledWith('http://localhost:3000/about/', true);
  });

  test('saving a different page is reported as a navigation', () => {
    const onNavigate = vi.fn();
    listen({ onNavigate });

    window.history.replaceState({}, '', '/about');
    save({ previewUrl: 'http://localhost:3000/contact' });
    vi.advanceTimersByTime(50);

    expect(onNavigate).toHaveBeenCalledWith('http://localhost:3000/contact', false);
  });

  test('a relative preview URL is resolved against the current origin', () => {
    const onNavigate = vi.fn();
    listen({ onNavigate });

    save({ previewUrl: '/news' });
    vi.advanceTimersByTime(50);

    expect(onNavigate).toHaveBeenCalledWith('http://localhost:3000/news', false);
  });
});

describe('busy reporting', () => {
  test('busy is raised as soon as the save lands, before the debounce elapses', () => {
    const onBusyChange = vi.fn();
    listen({ onNavigate: () => new Promise<void>(() => {}), onBusyChange });

    save();
    expect(onBusyChange).toHaveBeenCalledWith(true);

    vi.advanceTimersByTime(50);
    expect(onBusyChange).toHaveBeenCalledTimes(1);
  });

  test('busy is lowered once navigation settles', async () => {
    const onBusyChange = vi.fn();
    listen({ onNavigate: async () => {}, onBusyChange });

    save();
    vi.advanceTimersByTime(50);

    await vi.waitFor(() => expect(onBusyChange).toHaveBeenLastCalledWith(false));
  });
});

describe('lifecycle', () => {
  test('update takes effect for the next save, and leaves a pending one alone', () => {
    const first = vi.fn();
    const second = vi.fn();
    const listener = listen({ onNavigate: first });

    save();
    listener.update({ onNavigate: second });
    vi.advanceTimersByTime(50);

    // The refresh already in flight is not cancelled by a re-render.
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();

    save();
    vi.advanceTimersByTime(50);
    expect(second).toHaveBeenCalledTimes(1);
  });

  test('stopping cancels a refresh that has not fired yet', () => {
    const onNavigate = vi.fn();
    const stop = createContentSavedListener({ onNavigate }).start();

    save();
    stop();
    vi.advanceTimersByTime(50);

    expect(onNavigate).not.toHaveBeenCalled();
  });

  test('starting twice handles each save once, and only the last stop cancels', () => {
    const onNavigate = vi.fn();
    const listener = createContentSavedListener({ onNavigate, refreshTimeout: false });
    const stopFirst = listener.start();
    const stopSecond = listener.start();

    save();
    expect(onNavigate).toHaveBeenCalledTimes(1);

    listener.update({ refreshTimeout: 50 });
    save({ contentLink: 'content-2' });
    stopFirst();
    stopFirst();
    vi.advanceTimersByTime(50);
    expect(onNavigate).toHaveBeenCalledTimes(2);

    stopSecond();
    save({ contentLink: 'content-3' });
    vi.advanceTimersByTime(50);
    expect(onNavigate).toHaveBeenCalledTimes(2);
  });
});
