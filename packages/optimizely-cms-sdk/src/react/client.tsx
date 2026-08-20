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
   * Coalesces the burst of events the CMS emits for a single save (page plus each
   * nested block), which land within a few ms of each other.
   * @default 50
   */
  refreshTimeout?: number | false;

  /**
   * Optional loading indicator shown during refresh delay.
   */
  children?: ReactNode;

  /**
   * Keeps the loading indicator visible while the caller is still navigating.
   * Needed because router APIs like Next.js `router.refresh()` return `void`,
   * so `onNavigate` resolving does not mean the new content has arrived.
   */
  busy?: boolean;
}

/**
 * Listens for Optimizely CMS content saved events and triggers navigation/refresh.
 * Rapid saves are coalesced into a single refresh.
 */
export const PreviewComponent: FunctionComponent<
  PropsWithChildren<PreviewComponentProps>
> = ({ onNavigate, refreshTimeout = 50, children, busy = false }) => {
  const [showMask, setShowMask] = useState<boolean>(false);
  const reloadDelay = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastProcessedRef = useRef<{ contentLink: string; timestamp: number } | null>(
    null,
  );

  // Read through a ref so the listener effect never re-runs. Callers pass an inline
  // arrow for `onNavigate`, and re-subscribing would clearTimeout a pending refresh.
  const optionsRef = useRef({ onNavigate, refreshTimeout });
  useEffect(() => {
    optionsRef.current = { onNavigate, refreshTimeout };
  });

  useEffect(() => {
    const normalizeUrl = (url: string): string => {
      const parsed = new URL(url);
      parsed.pathname = parsed.pathname.replace(/\/$/, '') || '/';
      return parsed.toString();
    };

    const handleContentSaved = (eventData: ContentSavedEvent) => {
      const { onNavigate, refreshTimeout } = optionsRef.current;

      // With debouncing on, the timer already coalesces repeats. Only the
      // `refreshTimeout={false}` path needs an explicit dupe guard.
      if (!refreshTimeout) {
        const now = Date.now();
        if (
          lastProcessedRef.current &&
          lastProcessedRef.current.contentLink === eventData.contentLink &&
          now - lastProcessedRef.current.timestamp < 50
        ) {
          return;
        }
        lastProcessedRef.current = { contentLink: eventData.contentLink, timestamp: now };
      }

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

    return () => {
      window.removeEventListener('optimizely:cms:contentSaved', customEventListener);
      if (reloadDelay.current) clearTimeout(reloadDelay.current);
    };
  }, []);

  return (showMask || busy) && children ? <>{children}</> : null;
};
