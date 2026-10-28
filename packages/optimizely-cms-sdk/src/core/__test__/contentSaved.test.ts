import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  classifySave,
  createContentSavedListener,
  type ContentSavedEvent,
  type ContentSavedListenerOptions,
} from '../preview/contentSaved.js';

const EVENT_NAME = 'optimizely:cms:contentSaved';

const TOKEN_URL = 'http://localhost:3000/about?preview_token=editor';
const READY_URL = 'http://localhost:3000/about?preview_token=indexer';

const dispatch = (detail: ContentSavedEvent) =>
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail }));

/** The message carrying the editor's token. */
const tokenMessage = (overrides: Partial<ContentSavedEvent> = {}) =>
  dispatch({
    contentLink: 'content-1',
    previewUrl: TOKEN_URL,
    previewToken: 'editor',
    sectionId: 'LayoutItem/Composition/36b9',
    ...overrides,
  });

/** The message saying the change is ready, carrying the indexer's token. */
const readyMessage = (overrides: Partial<ContentSavedEvent> = {}) =>
  dispatch({
    contentLink: 'content-1',
    previewUrl: READY_URL,
    previewToken: 'indexer',
    ...overrides,
  });

/** One save as the CMS sends it. */
const save = (overrides: Partial<ContentSavedEvent> = {}) => {
  tokenMessage(overrides);
  readyMessage();
};

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

describe('classifySave', () => {
  const message = (extra: Partial<ContentSavedEvent> = {}): ContentSavedEvent => ({
    contentLink: '250_549',
    previewUrl: 'https://localhost:3000/preview?key=abc&ver=549&preview_token=token',
    previewToken: 'token',
    ...extra,
  });

  test('a message saying where the edit happened is the token message, whichever field it uses', () => {
    expect(classifySave(message({ sectionId: 'LayoutItem/Composition/36b9' }))).toBe(
      'token',
    );
    expect(classifySave(message({ nodeIds: ['9acc4bdc'] }))).toBe('token');
    expect(classifySave(message({ nodeIds: [] }))).toBe('token');
  });

  test('a message without a location is the ready message', () => {
    expect(classifySave(message())).toBe('ready');
  });
});

describe('pairing the two messages of a save', () => {
  test('navigates once, when the ready message arrives', () => {
    const onNavigate = vi.fn();
    listen({ onNavigate });

    tokenMessage();
    vi.advanceTimersByTime(1000);
    expect(onNavigate).not.toHaveBeenCalled();

    readyMessage();
    vi.advanceTimersByTime(50);
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  test("navigates to the token message's URL, never the ready message's", () => {
    const onNavigate = vi.fn();
    listen({ onNavigate });

    save();
    vi.advanceTimersByTime(50);

    expect(onNavigate).toHaveBeenCalledWith(TOKEN_URL, false);
  });

  test('a ready message that arrives first waits for the token message', () => {
    const onNavigate = vi.fn();
    listen({ onNavigate });

    readyMessage();
    vi.advanceTimersByTime(1000);
    expect(onNavigate).not.toHaveBeenCalled();

    tokenMessage();
    vi.advanceTimersByTime(50);
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledWith(TOKEN_URL, false);
  });

  test('a newer token message replaces an older one still waiting', () => {
    const onNavigate = vi.fn();
    listen({ onNavigate });

    tokenMessage({ previewUrl: '/about?preview_token=old' });
    tokenMessage({ previewUrl: '/about?preview_token=new' });
    readyMessage();
    vi.advanceTimersByTime(50);

    expect(onNavigate).toHaveBeenCalledWith(
      'http://localhost:3000/about?preview_token=new',
      false,
    );
  });

  test('overlapping saves each get a refresh when their ready message arrives', () => {
    const onNavigate = vi.fn();
    listen({ onNavigate });

    tokenMessage({ previewUrl: '/about?preview_token=first' });
    tokenMessage({ previewUrl: '/about?preview_token=second' });
    readyMessage();
    vi.advanceTimersByTime(50);
    expect(onNavigate).toHaveBeenCalledTimes(1);

    readyMessage();
    vi.advanceTimersByTime(50);
    expect(onNavigate).toHaveBeenCalledTimes(2);
    expect(onNavigate).toHaveBeenLastCalledWith(
      'http://localhost:3000/about?preview_token=second',
      false,
    );
  });
});

describe('when half a save goes missing', () => {
  test('a lone token message navigates after the fallback', () => {
    const onNavigate = vi.fn();
    listen({ onNavigate });

    tokenMessage();
    vi.advanceTimersByTime(4999);
    expect(onNavigate).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1 + 50);
    expect(onNavigate).toHaveBeenCalledWith(TOKEN_URL, false);
  });

  test("a lone ready message refreshes the current URL, keeping the page's token", () => {
    const onNavigate = vi.fn();
    listen({ onNavigate });

    window.history.replaceState({}, '', '/about?preview_token=current');
    readyMessage();
    vi.advanceTimersByTime(5000 + 50);

    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledWith(
      'http://localhost:3000/about?preview_token=current',
      true,
    );
  });

  test('a completed pair cancels the fallback', () => {
    const onNavigate = vi.fn();
    listen({ onNavigate });

    save();
    vi.advanceTimersByTime(10_000);

    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  test('after the fallback, the next save pairs up from scratch', () => {
    const onNavigate = vi.fn();
    listen({ onNavigate });

    readyMessage();
    vi.advanceTimersByTime(5000 + 50);
    expect(onNavigate).toHaveBeenCalledTimes(1);

    tokenMessage();
    vi.advanceTimersByTime(1000);
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});

describe('refreshTimeout', () => {
  test('nothing happens before the timeout elapses', () => {
    const onNavigate = vi.fn();
    listen({ onNavigate, refreshTimeout: 200 });

    save();
    vi.advanceTimersByTime(199);
    expect(onNavigate).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  test('back-to-back saves within the timeout merge into one navigation', () => {
    const onNavigate = vi.fn();
    listen({ onNavigate });

    save({ previewUrl: '/about?preview_token=first' });
    save({ previewUrl: '/about?preview_token=second' });
    vi.advanceTimersByTime(50);

    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledWith(
      'http://localhost:3000/about?preview_token=second',
      false,
    );
  });

  test('false navigates the moment the pair completes', () => {
    const onNavigate = vi.fn();
    listen({ onNavigate, refreshTimeout: false });

    tokenMessage();
    expect(onNavigate).not.toHaveBeenCalled();

    readyMessage();
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});

describe('without onNavigate', () => {
  // jsdom implements navigation for hash changes only, so the target differs by hash.
  test('replaces the current location with the target URL', () => {
    listen({});

    save({ previewUrl: '/#saved' });
    vi.advanceTimersByTime(50);

    expect(window.location.href).toBe('http://localhost:3000/#saved');
  });
});

describe('on the server', () => {
  afterEach(() => vi.unstubAllGlobals());

  test('start subscribes to nothing and returns a no-op stop', () => {
    const onNavigate = vi.fn();
    const listener = createContentSavedListener({ onNavigate, refreshTimeout: false });

    vi.stubGlobal('window', undefined);
    const stop = listener.start();
    vi.unstubAllGlobals();

    save();
    expect(onNavigate).not.toHaveBeenCalled();
    expect(() => stop()).not.toThrow();
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
  test('busy is raised as soon as the first message lands', () => {
    const onBusyChange = vi.fn();
    listen({ onNavigate: () => new Promise<void>(() => {}), onBusyChange });

    tokenMessage();
    expect(onBusyChange).toHaveBeenCalledWith(true);

    readyMessage();
    vi.advanceTimersByTime(50);
    expect(onBusyChange).not.toHaveBeenCalledWith(false);
  });

  test('busy is lowered once navigation settles', async () => {
    const onBusyChange = vi.fn();
    listen({ onNavigate: async () => {}, onBusyChange });

    save();
    vi.advanceTimersByTime(50);

    await vi.waitFor(() => expect(onBusyChange).toHaveBeenLastCalledWith(false));
  });

  test('busy is lowered after the fallback too', async () => {
    const onBusyChange = vi.fn();
    listen({ onNavigate: async () => {}, onBusyChange });

    tokenMessage();
    vi.advanceTimersByTime(5000 + 50);

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

  test('stopping cancels the fallback and forgets a half-finished save', () => {
    const onNavigate = vi.fn();
    const listener = createContentSavedListener({ onNavigate, refreshTimeout: false });

    const stop = listener.start();
    tokenMessage();
    stop();
    vi.advanceTimersByTime(10_000);
    expect(onNavigate).not.toHaveBeenCalled();

    cleanups.push(listener.start());
    readyMessage();
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
    save();
    stopFirst();
    stopFirst();
    vi.advanceTimersByTime(50);
    expect(onNavigate).toHaveBeenCalledTimes(2);

    stopSecond();
    save();
    vi.advanceTimersByTime(50);
    expect(onNavigate).toHaveBeenCalledTimes(2);
  });
});
