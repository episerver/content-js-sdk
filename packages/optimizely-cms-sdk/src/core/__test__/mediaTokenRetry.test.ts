import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { startMediaTokenRetry, type MediaTokenRetryOptions } from '../preview/mediaTokenRetry.js';

const CMS = 'https://cms.example.com';
const IMAGE = `${CMS}/globalassets/cat.jpg`;
const OTHER = 'https://images.example.org/cat.jpg';

const optimized = (url: string, width: number) => `/_next/image?url=${encodeURIComponent(url)}&w=${width}&q=75`;
const sourceOf = (url: string, name = 'url') => new URL(url, window.location.href).searchParams.get(name);

let stops: (() => void)[] = [];

/** Starts the retry and stops it when the test ends. */
const start = (options?: MediaTokenRetryOptions) => stops.push(startMediaTokenRetry(options));

const render = (html: string) => {
  document.body.innerHTML = html;
  return document.body.firstElementChild!;
};

const fail = (element: Element) => element.dispatchEvent(new Event('error'));

/** The `src` of an image after it failed once with the retry running. */
const failedSrc = (src: string, options?: MediaTokenRetryOptions) => {
  const image = render(`<img src="${src}">`);
  start(options);
  fail(image);
  return image.getAttribute('src');
};

const markFailed = (image: HTMLImageElement) => {
  Object.defineProperty(image, 'complete', { value: true });
  Object.defineProperty(image, 'naturalWidth', { value: 0 });
};

beforeEach(() => {
  window.history.replaceState({}, '', '/preview?preview_token=token-1');
  document.head.innerHTML = `<script src="${CMS}/util/javascript/communicationinjector.js"></script>`;
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
});

afterEach(() => {
  stops.forEach(stop => stop());
  stops = [];
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('startMediaTokenRetry', () => {
  test.each<[string, string, MediaTokenRetryOptions, string]>([
    ['retries a failed image with the token from the page URL', IMAGE, {}, `${IMAGE}?preview_token=token-1`],
    ['replaces a stale token instead of adding a second one', `${IMAGE}?w=500&preview_token=old`, {}, `${IMAGE}?w=500&preview_token=token-1`],
    ['reads the token from getToken when given', IMAGE, { getToken: () => 'from-event' }, `${IMAGE}?preview_token=from-event`],
    ['falls back to the page URL when getToken returns nothing', IMAGE, { getToken: () => undefined }, `${IMAGE}?preview_token=token-1`],
    ['prefers cmsUrl over the injector script host', IMAGE, { cmsUrl: 'https://other-cms.example.com' }, IMAGE],
    ['leaves an optimized image from another host alone', optimized(OTHER, 640), {}, optimized(OTHER, 640)],
    ['leaves an optimizer on another origin alone', `https://cdn.example.org${optimized(IMAGE, 640)}`, {}, `https://cdn.example.org${optimized(IMAGE, 640)}`],
  ])('%s', (_, src, options, expected) => {
    expect(failedSrc(src, options)).toBe(expected);
  });

  test('takes the CMS host from cmsUrl without an injector script', () => {
    document.head.innerHTML = '';

    expect(failedSrc(IMAGE, { cmsUrl: `${CMS}/` })).toBe(`${IMAGE}?preview_token=token-1`);
  });

  test('does nothing without a known CMS host', () => {
    document.head.innerHTML = '';

    expect(failedSrc(IMAGE)).toBe(IMAGE);
  });

  test('does nothing without a token', () => {
    window.history.replaceState({}, '', '/preview');

    expect(failedSrc(IMAGE)).toBe(IMAGE);
  });

  test('leaves images that load alone', () => {
    const image = render(`<img src="${IMAGE}">`);
    start();

    expect(image.getAttribute('src')).toBe(IMAGE);
  });

  test('rewrites every srcset candidate, keeping its descriptor', () => {
    const image = render(`<img src="${IMAGE}" srcset="${IMAGE}?w=100 100w, ${IMAGE}?w=500 500w">`);
    start();

    fail(image);

    expect(image.getAttribute('srcset')).toBe(
      `${IMAGE}?w=100&preview_token=token-1 100w, ${IMAGE}?w=500&preview_token=token-1 500w`,
    );
  });

  test('leaves media on other hosts alone', () => {
    const image = render(`<img src="${OTHER}" srcset="${OTHER} 1x, ${IMAGE} 2x">`);
    start();

    fail(image);

    expect(image.getAttribute('src')).toBe(OTHER);
    expect(image.getAttribute('srcset')).toBe(`${OTHER} 1x, ${IMAGE}?preview_token=token-1 2x`);
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

  describe('through an image optimizer', () => {
    test('adds the token to the CMS URL inside src and every srcset candidate', () => {
      const image = render(
        `<img src="${optimized(IMAGE, 1080)}" srcset="${optimized(IMAGE, 640)} 1x, ${optimized(IMAGE, 1080)} 2x">`,
      );
      start();

      fail(image);

      const candidates = image.getAttribute('srcset')!.split(', ').map(it => it.split(' ')[0]);
      expect(sourceOf(image.getAttribute('src')!)).toBe(`${IMAGE}?preview_token=token-1`);
      expect(candidates.map(it => sourceOf(it))).toEqual([`${IMAGE}?preview_token=token-1`, `${IMAGE}?preview_token=token-1`]);
      expect(new URL(image.getAttribute('src')!).searchParams.get('w')).toBe('1080');
    });

    test('reads the source from any parameter, such as href', () => {
      const src = failedSrc(`/_image?href=${encodeURIComponent(IMAGE)}&w=640`);

      expect(sourceOf(src!, 'href')).toBe(`${IMAGE}?preview_token=token-1`);
    });
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
