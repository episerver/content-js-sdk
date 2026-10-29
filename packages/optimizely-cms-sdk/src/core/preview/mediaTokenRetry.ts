/**
 * Retries preview media that failed to load, this time with the preview token.
 *
 * @module
 */
import { withPreviewToken } from '../../util/preview.js';

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

const parseUrl = (url: string | undefined) => {
  if (!url) return undefined;
  try {
    return new URL(url, document.baseURI);
  } catch {
    return undefined;
  }
};

const originOf = (url: string | undefined) => parseUrl(url)?.origin;

// Looked up on every failure: frameworks may add the injector script after the media
const cmsOrigin = (cmsUrl: string | undefined) =>
  originOf(cmsUrl ?? document.querySelector<HTMLScriptElement>(INJECTOR_SCRIPT)?.src);

// Same-origin image optimizers take the CMS URL as a parameter: Next's `/_next/image?url=`, Astro's `/_image?href=`
const tokenizeOptimizerUrl = (url: string, tokenize: Tokenize) => {
  const parsed = parseUrl(url);
  if (!parsed || parsed.origin !== window.location.origin) return url;

  const changed = [...parsed.searchParams]
    .map(([name, value]) => [name, value, tokenize(value)])
    .filter(([, value, next]) => next !== value);
  if (changed.length === 0) return url;

  changed.forEach(([name, , next]) => parsed.searchParams.set(name, next));
  return parsed.href;
};

const tokenizer = (token: string, origin: string): Tokenize => {
  const tokenizeCmsUrl: Tokenize = url => (originOf(url) === origin ? withPreviewToken(url, token) : url);
  return url => tokenizeOptimizerUrl(tokenizeCmsUrl(url), tokenizeCmsUrl);
};

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

/** Rewrites one attribute. Returns whether it changed. */
const rewriteAttribute = (element: Element, name: string, rewriter: (value: string) => string) => {
  const value = element.getAttribute(name);
  const next = value && rewriter(value);
  if (!next || next === value) return false;

  element.setAttribute(name, next);
  return true;
};

// Every attribute is rewritten, so `some` runs only after the map
const rewrite = (elements: Element[], tokenize: Tokenize) =>
  elements
    .flatMap(element => [
      rewriteAttribute(element, 'src', tokenize),
      rewriteAttribute(element, 'srcset', srcset => tokenizeSrcset(srcset, tokenize)),
    ])
    .some(Boolean);

const sourcesOf = (parent: Element | null) =>
  parent ? [...parent.children].filter(it => it instanceof HTMLSourceElement) : [];

// Sources inside <picture> report their failure on the <img>, but the browser may have picked any of them
const retry = (element: MediaElement, tokenize: Tokenize) => {
  const sourceParent =
    element instanceof HTMLImageElement ?
      element.parentElement instanceof HTMLPictureElement ? element.parentElement : null
    : element;
  if (rewrite([element, ...sourcesOf(sourceParent)], tokenize) && element instanceof HTMLMediaElement)
    element.load();
};

const mediaElementOf = (target: EventTarget | null): MediaElement | null => {
  if (target instanceof HTMLImageElement || target instanceof HTMLMediaElement) return target;
  if (target instanceof HTMLSourceElement && target.parentElement instanceof HTMLMediaElement)
    return target.parentElement;
  return null;
};

// An SVG without intrinsic size also reports naturalWidth 0; it is retried once, harmlessly
const hasFailed = (element: MediaElement) =>
  element instanceof HTMLImageElement ?
    element.complete && element.naturalWidth === 0 && !!element.getAttribute('src')
  : !!element.error || element.networkState === HTMLMediaElement.NETWORK_NO_SOURCE;

/**
 * Listens for images and videos that fail to load and retries them with the
 * preview token, replacing a stale token if the URL already has one.
 *
 * Media URLs are rendered without the token so they stay the same across saves;
 * only media that needs it (unpublished or restricted) fails and is requested again.
 * Only URLs on the CMS host get the token, and without a known CMS host nothing is
 * retried. Media that already failed before the call is retried straight away. A
 * retry that would not change the URL is skipped, so media that fails with the
 * current token is not requested again until the token changes.
 *
 * @returns Stops listening.
 */
export function startMediaTokenRetry({ getToken, cmsUrl }: MediaTokenRetryOptions = {}): () => void {
  if (typeof document === 'undefined') return () => {};

  const retryWithToken = (element: MediaElement | null) => {
    if (!element) return;
    const token = getToken?.() ?? tokenFromLocation();
    const origin = cmsOrigin(cmsUrl);
    if (token && origin) retry(element, tokenizer(token, origin));
  };

  // `error` does not bubble, so it has to be caught on the way down
  const onError = (event: Event) => retryWithToken(mediaElementOf(event.target));
  document.addEventListener('error', onError, true);

  [...document.querySelectorAll<MediaElement>('img, video, audio')]
    .filter(hasFailed)
    .forEach(retryWithToken);

  return () => document.removeEventListener('error', onError, true);
}
