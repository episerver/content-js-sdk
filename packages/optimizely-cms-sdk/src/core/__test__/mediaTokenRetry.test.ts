import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { startMediaTokenRetry } from '../preview/mediaTokenRetry.js';

const IMAGE = 'https://cms.example.com/globalassets/cat.jpg';

let stops: (() => void)[] = [];

/** Starts the retry and stops it when the test ends. */
const start = (...args: Parameters<typeof startMediaTokenRetry>) => stops.push(startMediaTokenRetry(...args));

const render = (html: string) => {
  document.body.innerHTML = html;
  return document.body.firstElementChild!;
};

const fail = (element: Element) => element.dispatchEvent(new Event('error'));

const markFailed = (image: HTMLImageElement) => {
  Object.defineProperty(image, 'complete', { value: true });
  Object.defineProperty(image, 'naturalWidth', { value: 0 });
};

beforeEach(() => {
  window.history.replaceState({}, '', '/preview?preview_token=token-1');
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
});

afterEach(() => {
  stops.forEach(stop => stop());
  stops = [];
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('startMediaTokenRetry', () => {
  test('retries a failed image with the token from the page URL', () => {
    const image = render(`<img src="${IMAGE}">`);
    start();

    fail(image);

    expect(image.getAttribute('src')).toBe(`${IMAGE}?preview_token=token-1`);
  });

  test('leaves images that load alone', () => {
    const image = render(`<img src="${IMAGE}">`);
    start();

    expect(image.getAttribute('src')).toBe(IMAGE);
  });

  test('replaces a stale token instead of adding a second one', () => {
    const image = render(`<img src="${IMAGE}?w=500&preview_token=old">`);
    start();

    fail(image);

    expect(image.getAttribute('src')).toBe(`${IMAGE}?w=500&preview_token=token-1`);
  });

  test('rewrites every srcset candidate, keeping its descriptor', () => {
    const image = render(`<img src="${IMAGE}" srcset="${IMAGE}?w=100 100w, ${IMAGE}?w=500 500w">`);
    start();

    fail(image);

    expect(image.getAttribute('srcset')).toBe(
      `${IMAGE}?w=100&preview_token=token-1 100w, ${IMAGE}?w=500&preview_token=token-1 500w`,
    );
  });

  test('rewrites the sources of a picture when its image fails', () => {
    const picture = render(`<picture><source srcset="${IMAGE}?w=800"><img src="${IMAGE}"></picture>`);
    start();

    fail(picture.querySelector('img')!);

    expect(picture.querySelector('source')!.getAttribute('srcset')).toBe(`${IMAGE}?w=800&preview_token=token-1`);
  });

  test('rewrites and reloads a video when one of its sources fails', () => {
    const video = render(`<video><source src="${IMAGE}.mp4"></video>`) as HTMLVideoElement;
    start();

    fail(video.querySelector('source')!);

    expect(video.querySelector('source')!.getAttribute('src')).toBe(`${IMAGE}.mp4?preview_token=token-1`);
    expect(video.load).toHaveBeenCalledOnce();
  });

  test('does not request media again when it fails with the current token', () => {
    const video = render(`<video src="${IMAGE}.mp4"></video>`) as HTMLVideoElement;
    start();

    fail(video);
    fail(video);

    expect(video.load).toHaveBeenCalledOnce();
  });

  test('retries again once the token has changed', () => {
    const image = render(`<img src="${IMAGE}">`);
    start();

    fail(image);
    window.history.replaceState({}, '', '/preview?preview_token=token-2');
    fail(image);

    expect(image.getAttribute('src')).toBe(`${IMAGE}?preview_token=token-2`);
  });

  test('reads the token from getToken when given', () => {
    const image = render(`<img src="${IMAGE}">`);
    start({ getToken: () => 'from-event' });

    fail(image);

    expect(image.getAttribute('src')).toBe(`${IMAGE}?preview_token=from-event`);
  });

  test('does nothing without a token', () => {
    window.history.replaceState({}, '', '/preview');
    const image = render(`<img src="${IMAGE}">`);
    start();

    fail(image);

    expect(image.getAttribute('src')).toBe(IMAGE);
  });

  test('retries images that failed before it started', () => {
    const image = render(`<img src="${IMAGE}">`) as HTMLImageElement;
    markFailed(image);

    start();

    expect(image.getAttribute('src')).toBe(`${IMAGE}?preview_token=token-1`);
  });

  test('stops listening once stopped', () => {
    const image = render(`<img src="${IMAGE}">`);
    startMediaTokenRetry()();

    fail(image);

    expect(image.getAttribute('src')).toBe(IMAGE);
  });
});
