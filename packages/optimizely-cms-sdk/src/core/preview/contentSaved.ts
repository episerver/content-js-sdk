/**
 * Listens for the CMS `contentSaved` event and decides what the application
 * should navigate to.
 *
 * @module
 */
import { startMediaTokenRetry } from './mediaTokenRetry.js';

export interface ContentSavedEvent {
  contentLink: string;
  editUrl?: string;
  previewUrl: string;
  previewToken: string;
  /** Where the edit happened: one or the other, only on the editor's token message. */
  sectionId?: string;
  nodeIds?: string[];
}

/**
 * Callback for handling navigation/refresh when content is saved.
 * @param url - Target URL to navigate to
 * @param isSameUrl - True if URL matches current location (refresh), false if different (navigate)
 */
export type NavigateCallback = (url: string, isSameUrl: boolean) => void | Promise<void>;

export type ContentSavedListenerOptions = {
  /** Called with the target URL. Without one, the page hard-reloads. */
  onNavigate?: NavigateCallback;

  /**
   * Delay in ms between the CMS reporting a save as ready and navigating. False to
   * disable. Merges back-to-back saves into one refresh.
   * @default 50
   */
  refreshTimeout?: number | false;

  /** Called when a refresh starts and again when it settles. */
  onBusyChange?: (busy: boolean) => void;

  /**
   * Retries media that fails to load with the preview token. See `startMediaTokenRetry`.
   * Read when the listener starts.
   * @default true
   */
  mediaTokenRetry?: boolean;

  /** The CMS URL for the media retry. See `MediaTokenRetryOptions.cmsUrl`. */
  cmsUrl?: string;
};

const EVENT_NAME = 'optimizely:cms:contentSaved';

/** How long to wait for the other half of a save. Measured gap: under 1 s. */
const FALLBACK_TIMEOUT = 5000;

/** Two URLs pointing at the same page differ only by a trailing slash often enough to matter. */
const normalizeUrl = (url: string): string => {
  const parsed = new URL(url);
  parsed.pathname = parsed.pathname.replace(/\/$/, '') || '/';
  return parsed.toString();
};

// Only the token message says where the edit happened; the ready message never does
const isTokenMessage = (event: ContentSavedEvent) =>
  'sectionId' in event || 'nodeIds' in event;

const startRetry = (
  { mediaTokenRetry, cmsUrl }: ContentSavedListenerOptions,
  getToken: () => string | undefined,
) => (mediaTokenRetry === false ? undefined : startMediaTokenRetry({ cmsUrl, getToken }));

export type ContentSavedListener = {
  /** Subscribes to the event. Returns the unsubscribe. */
  start(): () => void;

  /**
   * Merges into the current options without resubscribing.
   *
   * Callers pass an inline arrow for `onNavigate`, and tearing the listener down
   * would `clearTimeout` a refresh that is already pending.
   */
  update(options: Partial<ContentSavedListenerOptions>): void;
};

/**
 * Creates a listener for the CMS content-saved event.
 *
 * The CMS sends two messages per save: one with the editor's preview token, and one
 * when the change is ready. It navigates once both have arrived, in either order, to
 * the token message's URL.
 *
 * Nothing is subscribed until {@linkcode ContentSavedListener.start} is called, so
 * importing this module is safe on the server.
 */
export function createContentSavedListener(
  initialOptions: ContentSavedListenerOptions = {},
): ContentSavedListener {
  let options = initialOptions;
  let reloadDelay: ReturnType<typeof setTimeout> | undefined;
  let fallback: ReturnType<typeof setTimeout> | undefined;
  let stopMediaTokenRetry: (() => void) | undefined;

  // Token messages minus ready messages, so overlapping saves each get a refresh
  let balance = 0;
  let tokenUrl = '';
  let latestToken: string | undefined;

  const navigate = (previewUrl: string) => {
    const { onNavigate, refreshTimeout = 50, onBusyChange } = options;

    if (reloadDelay) clearTimeout(reloadDelay);

    let finalUrl: string;
    try {
      finalUrl = new URL(previewUrl, window.location.origin).toString();
    } catch {
      finalUrl = previewUrl;
    }

    const isSameUrl = normalizeUrl(window.location.href) === normalizeUrl(finalUrl);

    const executeNavigation = () => {
      if (onNavigate) {
        Promise.resolve(onNavigate(finalUrl, isSameUrl)).finally(() =>
          onBusyChange?.(false),
        );
      } else {
        // Fallback: hard reload
        window.location.replace(finalUrl);
      }
    };

    if (refreshTimeout) {
      reloadDelay = setTimeout(executeNavigation, refreshTimeout);
    } else {
      executeNavigation();
    }
  };

  // The ready message's token lacks editor roles, so without a token message keep the page's
  const onFallback = () => {
    navigate(balance > 0 ? tokenUrl : window.location.href);
    balance = 0;
  };

  const handleContentSaved = (event: ContentSavedEvent) => {
    options.onBusyChange?.(true);

    const isToken = isTokenMessage(event);
    // The media retry also needs the editor's token, not the ready message's
    if (isToken) {
      tokenUrl = event.previewUrl;
      latestToken = event.previewToken;
    }
    balance += isToken ? 1 : -1;

    // Completes a pair when it cancels out a message of the other kind
    if (isToken ? balance <= 0 : balance >= 0) navigate(tokenUrl);

    clearTimeout(fallback);
    if (balance) fallback = setTimeout(onFallback, FALLBACK_TIMEOUT);
  };

  // One window listener however many times `start` is called; the last stop removes it
  const listener = (event: Event) =>
    handleContentSaved((event as CustomEvent).detail as ContentSavedEvent);
  let subscribers = 0;

  return {
    update(next) {
      options = { ...options, ...next };
    },

    start() {
      if (typeof window === 'undefined') return () => {};

      if (subscribers === 0) {
        window.addEventListener(EVENT_NAME, listener);
        stopMediaTokenRetry = startRetry(options, () => latestToken);
      }
      subscribers++;

      let stopped = false;

      return () => {
        if (stopped) return;
        stopped = true;
        subscribers--;

        if (subscribers > 0) return;
        window.removeEventListener(EVENT_NAME, listener);
        stopMediaTokenRetry?.();
        if (reloadDelay) clearTimeout(reloadDelay);
        clearTimeout(fallback);
        balance = 0;
      };
    },
  };
}
