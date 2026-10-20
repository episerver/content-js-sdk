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
import {
  PREVIEW_ELEMENT_ID,
  PREVIEW_PROTOCOL_VERSION,
  PreviewMessageType,
  RESIZE_MIN_DELTA,
  type PreviewDimensions,
  type PreviewMessage,
} from '../core/preview/protocol.js';

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

/** Props for {@linkcode PreviewReporter}. */
export type PreviewReporterProps = {
  /** The content type being previewed, echoed back so a parent can correlate. */
  contentType?: string;

  /**
   * The origin allowed to receive these messages, from the preview URL. Without
   * one the reporter stays silent: posting to `'*'` would hand the measurement
   * to whatever happens to be embedding the page, and a preview opened directly
   * in a tab has no parent to talk to.
   */
  parentOrigin?: string;

  /** Reported instead of a measurement when the preview could not render. */
  error?: { code: string; message: string };
};

/**
 * How long to wait for fonts and images before measuring anyway. An image that
 * never loads must not hold back the measurement: a late `resize` corrects a
 * tile, whereas a `ready` that never arrives leaves it unmeasured for good.
 */
const READY_TIMEOUT = 2000;

/** Resolves when an image has decoded, failed, or turns out not to be loadable. */
function imageSettled(image: HTMLImageElement) {
  // `decode` is the precise signal but is missing in some environments.
  if (typeof image.decode === 'function') {
    return image.decode().catch(() => undefined);
  }

  return new Promise(resolve => {
    image.addEventListener('load', resolve, { once: true });
    image.addEventListener('error', resolve, { once: true });
  });
}

/** Resolves once fonts have loaded and the images already on screen have decoded. */
async function settled(element: Element) {
  const work = Promise.all([
    document.fonts?.ready,
    ...[...element.querySelectorAll('img')]
      .filter(image => !image.complete)
      .map(imageSettled),
  ]);

  await Promise.race([
    work,
    new Promise(resolve => setTimeout(resolve, READY_TIMEOUT)),
  ]);

  // One frame with no further work queued, so a layout triggered by the above
  // has been applied before anything is measured.
  await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)));
}

/**
 * Tells the embedding page how large the rendered component is, so it can scale
 * the preview into a tile without cropping it or stranding it in whitespace.
 *
 * Measures the component's own box rather than the document's: a component
 * occupying 200px of a 900px-tall page reports 200px, or every tile is mostly
 * empty. Sends `ready` once the layout has settled, then `resize` if the height
 * later changes by more than {@linkcode RESIZE_MIN_DELTA}.
 *
 * Rendered by {@linkcode createComponentPreviewPage}; a page building its own
 * preview route can render it directly. See `specs/003-preview-iframe-protocol`.
 */
export function PreviewReporter({
  contentType,
  parentOrigin,
  error,
}: PreviewReporterProps) {
  useEffect(() => {
    // Nothing to tell when the page is not framed, and nowhere safe to send it
    // when the parent has not identified itself.
    if (window.parent === window || !parentOrigin) return;

    const post = (message: PreviewMessage) => {
      try {
        window.parent.postMessage(message, parentOrigin);
      } catch {
        // A malformed `parentOrigin` throws rather than delivering. The parent
        // has a timeout for exactly this, so staying quiet is the right failure.
      }
    };

    if (error) {
      post({
        type: PreviewMessageType.error,
        version: PREVIEW_PROTOCOL_VERSION,
        payload: { ...error, contentType },
      });
      return;
    }

    const element = document.getElementById(PREVIEW_ELEMENT_ID);
    if (!element) return;

    let lastHeight = 0;
    let lastWidth = 0;
    let cancelled = false;
    let observer: ResizeObserver | undefined;

    /**
     * The union of the wrapper's children, not the wrapper itself.
     *
     * The wrapper is full-width by design, so measuring it reports the page's
     * width for every component and a button comes back as 1280px wide. The
     * children are the component, so their union is the box worth framing.
     */
    const measure = (): PreviewDimensions => {
      const host = element.getBoundingClientRect();
      // Zero-area children are skipped: a `<script>`, a hidden input or
      // anything `display:none` reports a 0×0 rect at the document origin,
      // which would drag the union back to (0,0) and report a box far larger
      // than the component.
      const children = [...element.children]
        .map(child => child.getBoundingClientRect())
        .filter(rect => rect.width > 0 && rect.height > 0);

      const box =
        children.length === 0 ? host : (
          {
            left: Math.min(...children.map(rect => rect.left)),
            top: Math.min(...children.map(rect => rect.top)),
            right: Math.max(...children.map(rect => rect.right)),
            bottom: Math.max(...children.map(rect => rect.bottom)),
          }
        );

      return {
        width: Math.max(1, Math.round(box.right - box.left)),
        height: Math.max(1, Math.ceil(box.bottom - box.top)),
        offsetX: Math.round(box.left + window.scrollX),
        offsetY: Math.round(box.top + window.scrollY),
        viewportWidth: Math.round(document.documentElement.clientWidth),
        element: PREVIEW_ELEMENT_ID,
        contentType,
      };
    };

    settled(element).then(() => {
      if (cancelled) return;

      const dimensions = measure();
      lastHeight = dimensions.height;
      lastWidth = dimensions.width;

      post({
        type: PreviewMessageType.ready,
        version: PREVIEW_PROTOCOL_VERSION,
        payload: dimensions,
      });

      // Kept open rather than measured once: a late web font or a lazily
      // decoded image changes the height after any reasonable readiness
      // signal, and a tile sized before that stays wrong all session.
      observer = new ResizeObserver(() => {
        const next = measure();
        // Width as well as height: the parent scales by the reported width, so
        // a component that only grows sideways after load would otherwise be
        // cropped against a stale measurement.
        const moved =
          Math.abs(next.height - lastHeight) >= RESIZE_MIN_DELTA ||
          Math.abs(next.width - lastWidth) >= RESIZE_MIN_DELTA;
        if (!moved) return;

        const previousHeight = lastHeight;
        lastHeight = next.height;
        lastWidth = next.width;

        post({
          type: PreviewMessageType.resize,
          version: PREVIEW_PROTOCOL_VERSION,
          payload: { ...next, previousHeight },
        });
      });
      observer.observe(element);
    });

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [contentType, parentOrigin, error?.code, error?.message]);

  return null;
}
