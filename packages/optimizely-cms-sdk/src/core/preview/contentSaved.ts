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
   * Delay in ms before triggering navigation. False to disable.
   * Coalesces the burst of events the CMS emits for a single save (page plus each
   * nested block), which land within a few ms of each other.
   * @default 50
   */
  refreshTimeout?: number | false;

  /** Called when a refresh starts and again when it settles. */
  onBusyChange?: (busy: boolean) => void;
};

const EVENT_NAME = 'optimizely:cms:contentSaved';

/** Two URLs pointing at the same page differ only by a trailing slash often enough to matter. */
const normalizeUrl = (url: string): string => {
  const parsed = new URL(url);
  parsed.pathname = parsed.pathname.replace(/\/$/, '') || '/';
  return parsed.toString();
};

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
 * Nothing is subscribed until {@linkcode ContentSavedListener.start} is called, so
 * importing this module is safe on the server.
 */
export function createContentSavedListener(
  initialOptions: ContentSavedListenerOptions = {},
): ContentSavedListener {
  let options = initialOptions;
  let reloadDelay: ReturnType<typeof setTimeout> | undefined;
  let lastProcessed: { contentLink: string; timestamp: number } | null = null;

  const handleContentSaved = (eventData: ContentSavedEvent) => {
    const { onNavigate, refreshTimeout = 50, onBusyChange } = options;

    // With debouncing on, the timer already coalesces repeats. Only the
    // `refreshTimeout={false}` path needs an explicit dupe guard.
    if (!refreshTimeout) {
      const now = Date.now();
      if (
        lastProcessed &&
        lastProcessed.contentLink === eventData.contentLink &&
        now - lastProcessed.timestamp < 50
      ) {
        return;
      }
      lastProcessed = { contentLink: eventData.contentLink, timestamp: now };
    }

    const currentUrl = window.location.href;

    onBusyChange?.(true);

    if (reloadDelay) clearTimeout(reloadDelay);

    let finalUrl: string;
    try {
      finalUrl = new URL(eventData.previewUrl, window.location.origin).toString();
    } catch {
      finalUrl = eventData.previewUrl;
    }

    const isSameUrl = normalizeUrl(currentUrl) === normalizeUrl(finalUrl);

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
      };
    },
  };
}
