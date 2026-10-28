/**
 * Listens for the CMS `contentSaved` event and decides what the application
 * should navigate to.
 *
 * @module
 */

export interface ContentSavedEvent {
  contentLink: string;
  editUrl?: string;
  previewUrl: string;
  previewToken: string;
  /** Where the edit happened: one or the other, only on the editor's token message. */
  sectionId?: string;
  nodeIds?: string[];
}

/** Which of the two messages the CMS sends per save this is. */
export type SaveKind = 'token' | 'ready';

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

/**
 * Tells apart the two messages the CMS sends per save: `token` carries the editor's
 * preview token, `ready` means the change is ready to fetch. Only the token message
 * says where the edit happened, so that field decides, not the arrival order.
 */
export const classifySave = (event: ContentSavedEvent): SaveKind =>
  'sectionId' in event || 'nodeIds' in event ? 'token' : 'ready';

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
 * The CMS sends two messages per save. It navigates once, when the ready message
 * arrives, to the token message's URL, since only that token works for preview.
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

  // Token messages minus ready messages, so overlapping saves each get a refresh
  let balance = 0;
  let latestToken: ContentSavedEvent | undefined;

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
        Promise.resolve(onNavigate(finalUrl, isSameUrl)).finally(() => onBusyChange?.(false));
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
    navigate(balance > 0 && latestToken ? latestToken.previewUrl : window.location.href);
    balance = 0;
    fallback = undefined;
  };

  const handleContentSaved = (event: ContentSavedEvent) => {
    options.onBusyChange?.(true);

    const isToken = classifySave(event) === 'token';
    if (isToken) latestToken = event;
    balance += isToken ? 1 : -1;

    // A message that cancels out one of the other kind completes a pair, in either order
    const completesPair = isToken ? balance <= 0 : balance >= 0;
    if (completesPair) navigate(latestToken?.previewUrl ?? window.location.href);

    if (fallback) clearTimeout(fallback);
    fallback = balance === 0 ? undefined : setTimeout(onFallback, FALLBACK_TIMEOUT);
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

      if (subscribers === 0) window.addEventListener(EVENT_NAME, listener);
      subscribers++;

      let stopped = false;

      return () => {
        if (stopped) return;
        stopped = true;
        subscribers--;

        if (subscribers > 0) return;
        window.removeEventListener(EVENT_NAME, listener);
        if (reloadDelay) clearTimeout(reloadDelay);
        if (fallback) clearTimeout(fallback);
        fallback = undefined;
        balance = 0;
        latestToken = undefined;
      };
    },
  };
}
