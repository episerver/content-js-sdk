/**
 * Retries preview media that failed to load, this time with the preview token.
 *
 * Media URLs are rendered without the token so they stay the same across saves.
 * Only media that needs the token (unpublished or restricted) fails, and only
 * that media is requested again.
 *
 * @module
 */
import { withToken } from '../../util/preview.js';

export type MediaTokenRetryOptions = {
  /**
   * The token to retry with, read at the moment media fails.
   * @default the `preview_token` query parameter of the page URL
   */
  getToken?: () => string | null | undefined;
};

type MediaElement = HTMLImageElement | HTMLMediaElement;

const tokenFromLocation = () => new URLSearchParams(window.location.search).get('preview_token');

const withTokenInSrcset = (srcset: string, token: string) =>
  srcset
    .split(',')
    .map(candidate => candidate.trim())
    .filter(Boolean)
    .map(candidate => {
      const [url, ...descriptors] = candidate.split(/\s+/);
      return [withToken(url, token), ...descriptors].join(' ');
    })
    .join(', ');

const REWRITERS: Record<string, (value: string, token: string) => string> = {
  src: withToken,
  srcset: withTokenInSrcset,
};

/** Rewrites the URL attributes of each element. Returns whether any of them changed. */
const rewrite = (elements: Element[], token: string): boolean =>
  elements
    .flatMap(element =>
      Object.entries(REWRITERS).map(([name, rewriter]) => {
        const value = element.getAttribute(name);
        if (!value) return false;

        const next = rewriter(value, token);
        if (next === value) return false;

        element.setAttribute(name, next);
        return true;
      }),
    )
    .some(Boolean);

const sourcesOf = (parent: Element | null) =>
  parent ? [...parent.children].filter(it => it instanceof HTMLSourceElement) : [];

// Sources inside <picture> report their failure on the <img>, but the browser may have picked any of them
const retryImage = (image: HTMLImageElement, token: string) => {
  const picture = image.parentElement instanceof HTMLPictureElement ? image.parentElement : null;
  rewrite([image, ...sourcesOf(picture)], token);
};

const retryMedia = (media: HTMLMediaElement, token: string) => {
  if (rewrite([media, ...sourcesOf(media)], token)) media.load();
};

const retry = (element: MediaElement, token: string) =>
  element instanceof HTMLImageElement ? retryImage(element, token) : retryMedia(element, token);

/** The element whose sources to rewrite, given the target of an `error` event. */
const mediaElementOf = (target: EventTarget | null): MediaElement | null => {
  if (target instanceof HTMLImageElement || target instanceof HTMLMediaElement) return target;
  if (target instanceof HTMLSourceElement && target.parentElement instanceof HTMLMediaElement)
    return target.parentElement;
  return null;
};

const hasFailed = (element: MediaElement) =>
  element instanceof HTMLImageElement ?
    element.complete && element.naturalWidth === 0 && !!element.getAttribute('src')
  : !!element.error || element.networkState === HTMLMediaElement.NETWORK_NO_SOURCE;

/**
 * Listens for images and videos that fail to load and retries them with the
 * preview token, replacing a stale token if the URL already has one.
 *
 * Media that already failed before the call is retried straight away. A retry
 * that would not change the URL is skipped, so media that fails with the current
 * token is not requested again until the token changes.
 *
 * @returns Stops listening.
 */
export function startMediaTokenRetry({
  getToken = tokenFromLocation,
}: MediaTokenRetryOptions = {}): () => void {
  if (typeof document === 'undefined') return () => {};

  const retryWithToken = (element: MediaElement | null) => {
    const token = getToken();
    if (element && token) retry(element, token);
  };

  // `error` does not bubble, so it has to be caught on the way down
  const onError = (event: Event) => retryWithToken(mediaElementOf(event.target));
  document.addEventListener('error', onError, true);

  [...document.querySelectorAll<MediaElement>('img, video, audio')]
    .filter(hasFailed)
    .forEach(retryWithToken);

  return () => document.removeEventListener('error', onError, true);
}
