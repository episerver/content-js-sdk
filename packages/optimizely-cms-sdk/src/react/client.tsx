'use client';
import {
  useState,
  useEffect,
  type ReactNode,
  type FunctionComponent,
  type PropsWithChildren,
} from 'react';
import {
  createContentSavedListener,
  type NavigateCallback,
} from '../core/preview/contentSaved.js';

export type { NavigateCallback };

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

  const [listener] = useState(createContentSavedListener);

  // Pushed on every render rather than passed to `start`, so the subscription
  // survives the inline arrow callers give for `onNavigate`.
  useEffect(() => {
    listener.update({
      onNavigate,
      refreshTimeout,
      onBusyChange: setShowMask,
    });
  });

  useEffect(() => listener.start(), [listener]);

  return (showMask || busy) && children ? <>{children}</> : null;
};

/**
 * Reports the document height to the embedding page, so an iframe around a
 * preview can size itself to the component it is showing.
 *
 * Rendered by {@linkcode createComponentPreviewPage}; a page building its own
 * preview route can render it directly.
 */
export function PreviewHeightReporter() {
  useEffect(() => {
    // Nothing to tell when the page is not in a frame.
    if (window.parent === window) return;

    const postHeight = () => {
      const height = Math.ceil(document.documentElement.scrollHeight);
      window.parent.postMessage({ type: 'preview-height', height }, '*');
    };

    postHeight();

    const observer = new ResizeObserver(postHeight);
    observer.observe(document.documentElement);
    window.addEventListener('load', postHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('load', postHeight);
    };
  }, []);

  return null;
}
