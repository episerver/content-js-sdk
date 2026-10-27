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
   * The token to retry with, read at the moment media fails. When it returns
   * nothing, the `preview_token` query parameter of the page URL is used.
   */
  getToken?: () => string | null | undefined;

  /**
   * The CMS URL, usually `OPTIMIZELY_CMS_URL`. Only media on this host gets the token.
   * @default the host the CMS communication injector script loads from
   */
  cmsUrl?: string;
};

type MediaElement = HTMLImageElement | HTMLMediaElement;
type Tokenize = (url: string) => string;

const INJECTOR_SCRIPT = 'script[src*="/util/javascript/communicationinjector.js"]';

const tokenFromLocation = () => new URLSearchParams(window.location.search).get('preview_token');

const originOf = (url: string | undefined) => {
  if (!url) return undefined;
  try {
    return new URL(url, document.baseURI).origin;
  } catch {
    return undefined;
  }
};

// Looked up on every failure: frameworks may add the injector script after the media
const cmsOrigin = (cmsUrl: string | undefined) =>
  originOf(cmsUrl ?? document.querySelector<HTMLScriptElement>(INJECTOR_SCRIPT)?.src);

/** Adds the token to URLs on the CMS host and leaves every other URL alone. */
const tokenizer =
  (token: string, origin: string): Tokenize =>
  url =>
    originOf(url) === origin ? withToken(url, token) : url;

const tokenizeSrcset = (srcset: string, tokenize: Tokenize) =>
  srcset
    .split(',')
    .map(candidate => candidate.trim())
    .filter(Boolean)
    .map(candidate => {
      const [url, ...descriptors] = candidate.split(/\s+/);
      return [tokenize(url), ...descriptors].join(' ');
    })
    .join(', ');

const REWRITERS: Record<string, (value: string, tokenize: Tokenize) => string> = {
  src: (value, tokenize) => tokenize(value),
  srcset: tokenizeSrcset,
};

/** Rewrites the URL attributes of each element. Returns whether any of them changed. */
const rewrite = (elements: Element[], tokenize: Tokenize): boolean =>
  elements
    .flatMap(element =>
      Object.entries(REWRITERS).map(([name, rewriter]) => {
        const value = element.getAttribute(name);
        if (!value) return false;

        const next = rewriter(value, tokenize);
        if (next === value) return false;

        element.setAttribute(name, next);
        return true;
      }),
    )
    .some(Boolean);

const sourcesOf = (parent: Element | null) =>
  parent ? [...parent.children].filter(it => it instanceof HTMLSourceElement) : [];

// Sources inside <picture> report their failure on the <img>, but the browser may have picked any of them
const retryImage = (image: HTMLImageElement, tokenize: Tokenize) => {
  const picture = image.parentElement instanceof HTMLPictureElement ? image.parentElement : null;
  rewrite([image, ...sourcesOf(picture)], tokenize);
};

const retryMedia = (media: HTMLMediaElement, tokenize: Tokenize) => {
  if (rewrite([media, ...sourcesOf(media)], tokenize)) media.load();
};

const retry = (element: MediaElement, tokenize: Tokenize) =>
  element instanceof HTMLImageElement ? retryImage(element, tokenize) : retryMedia(element, tokenize);

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
 * Only URLs on the CMS host get the token. Without a known CMS host nothing is
 * retried. Media that already failed before the call is retried straight away.
 * A retry that would not change the URL is skipped, so media that fails with the
 * current token is not requested again until the token changes.
 *
 * @returns Stops listening.
 */
export function startMediaTokenRetry({ getToken, cmsUrl }: MediaTokenRetryOptions = {}): () => void {
  if (typeof document === 'undefined') return () => {};

  const retryWithToken = (element: MediaElement | null) => {
    const token = getToken?.() ?? tokenFromLocation();
    const origin = cmsOrigin(cmsUrl);
    if (element && token && origin) retry(element, tokenizer(token, origin));
  };

  // `error` does not bubble, so it has to be caught on the way down
  const onError = (event: Event) => retryWithToken(mediaElementOf(event.target));
  document.addEventListener('error', onError, true);

  [...document.querySelectorAll<MediaElement>('img, video, audio')]
    .filter(hasFailed)
    .forEach(retryWithToken);

  return () => document.removeEventListener('error', onError, true);
}
