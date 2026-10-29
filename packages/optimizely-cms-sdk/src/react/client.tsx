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
   * Delay in ms between the CMS reporting a save as ready and navigating. False to
   * disable. Merges back-to-back saves into one refresh.
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

  /**
   * The CMS URL, usually `OPTIMIZELY_CMS_URL`. Media on this host that fails to
   * load is retried with the preview token. Read once, when the component mounts.
   * @default the host the CMS communication injector script loads from
   */
  cmsUrl?: string;
}

/**
 * Listens for Optimizely CMS content saved events and triggers navigation/refresh,
 * once per save, after the CMS reports the change as ready.
 */
export const PreviewComponent: FunctionComponent<
  PropsWithChildren<PreviewComponentProps>
> = ({ onNavigate, refreshTimeout = 50, children, busy = false, cmsUrl }) => {
  const [showMask, setShowMask] = useState<boolean>(false);

  const [listener] = useState(createContentSavedListener);

  // Pushed on every render rather than passed to `start`, so the subscription
  // survives the inline arrow callers give for `onNavigate`.
  useEffect(() => {
    listener.update({
      onNavigate,
      refreshTimeout,
      onBusyChange: setShowMask,
      cmsUrl,
    });
  });

  useEffect(() => listener.start(), [listener]);

  return (showMask || busy) && children ? <>{children}</> : null;
};
