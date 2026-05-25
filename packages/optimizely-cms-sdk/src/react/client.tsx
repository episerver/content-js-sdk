'use client';
import {
  useState,
  useEffect,
  useRef,
  type ReactNode,
  type FunctionComponent,
  type PropsWithChildren,
} from 'react';

interface ContentSavedEvent {
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

export interface PreviewComponentProps {
  /**
   * Custom navigation handler. If not provided, uses window.location.replace.
   * @example Next.js
   * const router = useRouter();
   * <PreviewComponent onNavigate={(url, isSameUrl) => {
   *   if (isSameUrl) {
   *     router.refresh();
   *   } else {
   *     const parsed = new URL(url);
   *     router.push(parsed.pathname + parsed.search);
   *   }
   * }} />
   */
  onNavigate?: NavigateCallback;

  /**
   * Delay in ms before triggering navigation. False to disable.
   * Useful for debouncing rapid saves.
   * @default 300
   */
  refreshTimeout?: number | false;

  /**
   * Optional loading indicator shown during refresh delay.
   */
  children?: ReactNode;
}

/**
 * Listens for Optimizely CMS content saved events and triggers navigation/refresh.
 *
 * Uses dual event sources for maximum compatibility:
 * - window.epi.subscribe - Official CMS API (communicationinjector.js)
 * - Custom event 'optimizely:cms:contentSaved' - Fallback for older CMS
 *
 * Both may fire for same save. Deduplication prevents duplicate refreshes.
 */
export const PreviewComponent: FunctionComponent<
  PropsWithChildren<PreviewComponentProps>
> = ({ onNavigate, refreshTimeout = 300, children }) => {
  const [showMask, setShowMask] = useState<boolean>(false);
  const reloadDelay = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastProcessedRef = useRef<{ contentLink: string; timestamp: number } | null>(
    null,
  );

  useEffect(() => {
    const normalizeUrl = (url: string): string => {
      const parsed = new URL(url);
      parsed.pathname = parsed.pathname.replace(/\/$/, '') || '/';
      return parsed.toString();
    };

    const handleContentSaved = (eventData: ContentSavedEvent) => {
      const now = Date.now();

      // Ignore same contentLink within 50ms (deduplication for dual events)
      if (
        lastProcessedRef.current &&
        lastProcessedRef.current.contentLink === eventData.contentLink &&
        now - lastProcessedRef.current.timestamp < 50
      ) {
        return;
      }

      lastProcessedRef.current = { contentLink: eventData.contentLink, timestamp: now };

      const currentUrl = window.location.href;

      setShowMask(true);

      if (reloadDelay.current) clearTimeout(reloadDelay.current);

      let finalUrl: string;
      try {
        const url = new URL(eventData.previewUrl, window.location.origin);
        finalUrl = url.toString();
      } catch {
        finalUrl = eventData.previewUrl;
      }

      const isSameUrl = normalizeUrl(currentUrl) === normalizeUrl(finalUrl);

      const executeNavigation = () => {
        if (onNavigate) {
          Promise.resolve(onNavigate(finalUrl, isSameUrl)).finally(() =>
            setShowMask(false),
          );
        } else {
          // Fallback: hard reload
          window.location.replace(finalUrl);
        }
      };

      if (refreshTimeout) {
        reloadDelay.current = setTimeout(executeNavigation, refreshTimeout);
      } else {
        executeNavigation();
      }
    };

    const customEventListener = (event: Event) =>
      handleContentSaved((event as CustomEvent).detail as ContentSavedEvent);

    window.addEventListener('optimizely:cms:contentSaved', customEventListener);

    let unsubscribeEpi: (() => void) | undefined;
    let cancelled = false;

    // Try to subscribe to window.epi if available
    waitFor(() => window.epi, 10, 250)
      .then(epi => {
        if (!cancelled) {
          const subscription = epi.subscribe('contentSaved', handleContentSaved);
          unsubscribeEpi = subscription.remove;
        }
      })
      .catch(() => {
        // window.epi not available - fine, we have custom event
      });

    return () => {
      cancelled = true;
      window.removeEventListener('optimizely:cms:contentSaved', customEventListener);
      if (unsubscribeEpi) unsubscribeEpi();
      if (reloadDelay.current) clearTimeout(reloadDelay.current);
    };
  }, [onNavigate, refreshTimeout]);

  return showMask && children ? <>{children}</> : null;
};

function waitFor<T>(
  fn: () => T | undefined,
  timeOutSeconds: number = 10,
  intervalMs: number = 250,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const iv = setInterval(() => {
      try {
        const cv = fn();
        if (cv !== undefined) {
          clearInterval(iv);
          clearTimeout(wt);
          resolve(cv);
        }
      } catch {
        // Ignore errors
      }
    }, intervalMs);
    const wt = setTimeout(() => {
      clearInterval(iv);
      reject(`Function did not yield value within ${timeOutSeconds} seconds`);
    }, timeOutSeconds * 1000);
  });
}

declare global {
  interface Window {
    epi?: {
      subscribe: (
        eventName: string,
        handler: (data: ContentSavedEvent) => void,
      ) => {
        remove: () => void;
      };
    };
  }
}
