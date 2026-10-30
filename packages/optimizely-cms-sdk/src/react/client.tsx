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
import { isDev } from '../util/environment.js';
import {
  isMeasureRequest,
  PREVIEW_ELEMENT_ID,
  PreviewAttribute,
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

  /**
   * The CMS URL, usually `OPTIMIZELY_CMS_URL`. Media on this host that fails to
   * load is retried with the preview token. Read once, when the component mounts.
   * @default the host the CMS communication injector script loads from
   */
  cmsUrl?: string;
}

/**
 * Listens for Optimizely CMS content saved events and triggers navigation/refresh.
 * Rapid saves are coalesced into a single refresh.
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

/** Props for {@linkcode PreviewReporter}. */
export type PreviewReporterProps = {
  /** The content type being previewed, echoed back so a parent can correlate. */
  contentType?: string;

  /**
   * Origins allowed to receive these messages. Empty means silence — posting
   * to `'*'` would hand the measurement to whoever embeds the page. Posted
   * once per origin; the browser delivers only to the real parent.
   */
  parentOrigins?: string[];

  /** Reported instead of a measurement when the preview could not render. */
  error?: { code: string; message: string };

  /**
   * Scale the component down to fit the viewport, centred — for a thumbnail
   * that wants the whole component whatever its size. Never above 1. The
   * reported measurement describes how it ends up looking.
   */
  fit?: boolean;
};

/** Measure anyway after this: a measurement that never arrives is worse than a late one. */
const READY_TIMEOUT = 2000;

/**
 * Breathing room kept between a fitted component and the viewport edge, in
 * CSS pixels per side. A component fitted edge to edge reads as cropped in a
 * thumbnail even when all of it is there.
 */
const FIT_INSET = 8;

/** Resolves when an image has decoded, failed, or cannot load. */
function imageSettled(image: HTMLImageElement) {
  // The precise signal, but missing in some environments.
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
 * Tells the embedding page how large the rendered component is, so it can be
 * scaled into a tile. Measures the component's own box, not the document's:
 * a component filling 200px of a 900px page reports 200px.
 *
 * Sends a measurement once the layout settles, then again whenever the box
 * moves by at least {@linkcode RESIZE_MIN_DELTA}. Rendered by
 * {@linkcode createStandalonePreview}.
 */
export function PreviewReporter({
  contentType,
  parentOrigins,
  error,
  fit,
}: PreviewReporterProps) {
  // A new array each render would restart the effect every time.
  const targets = (parentOrigins ?? []).join(' ');

  useEffect(() => {
    // Fitting is how the page looks, reporting is who hears about it. They are
    // independent: a preview opened directly in a tab still fits itself.
    const framed = window.parent !== window;
    const canPost = framed && targets.length > 0;

    // Framed but the site named nobody. Staying silent is correct — a
    // measurement must not go to an origin the site has not approved — but
    // from the outside silence is indistinguishable from a broken preview.
    if (framed && targets.length === 0 && isDev()) {
      console.warn(
        '[optimizely] This preview is embedded but reports nothing: no ' +
          '`parentOrigin` is configured on the preview page, so there is no ' +
          'origin it is allowed to post to.',
      );
    }

    const post = (message: PreviewMessage) => {
      if (!canPost) return;

      // Logged from inside the frame, so a preview that is not reporting can
      // be diagnosed by opening the devtools on it.
      if (isDev()) {
        console.debug('[optimizely] preview →', message.type, message.payload);
      }

      for (const origin of targets.split(' ')) {
        try {
          window.parent.postMessage(message, origin);
        } catch {
          // A malformed origin throws rather than delivering. The parent has a
          // timeout for exactly this, so staying quiet is the right failure.
        }
      }
    };

    if (error) {
      post({
        type: PreviewMessageType.error,
        version: PREVIEW_PROTOCOL_VERSION,
        payload: { ...error, contentType },
      });
      document
        .getElementById(PREVIEW_ELEMENT_ID)
        ?.setAttribute(PreviewAttribute.error, error.code);
      return;
    }

    const element = document.getElementById(PREVIEW_ELEMENT_ID);
    if (!element) return;

    let last: PreviewDimensions | undefined;
    let cancelled = false;
    let observer: ResizeObserver | undefined;
    // Listeners live past the measurement they were added for, so they are
    // torn down by signal rather than by hand.
    const listening = new AbortController();

    // Shrinks the component to fit the viewport. A transform changes no
    // layout, so this cannot make the component reflow.
    const applyFit = () => {
      if (!fit) return;

      // Measured unfitted, so repeated calls do not compound.
      element.style.transform = '';
      element.style.height = '';

      const { width, height } = measure();

      // Inset, not padding on the page: padding would shift the box the
      // component is centred in and add to the page's own height. Fitting
      // into a smaller box leaves the gap and moves nothing.
      // Floored at 1: a frame smaller than the inset would otherwise fit to a
      // negative box and flip the component inside out.
      const inset = (size: number) => Math.max(1, size - 2 * FIT_INSET);
      const viewportWidth = inset(document.documentElement.clientWidth);
      const viewportHeight = inset(document.documentElement.clientHeight);

      const scale = Math.min(1, viewportWidth / width, viewportHeight / height);
      if (scale >= 1) return;

      // A transform shrinks what is drawn, not the space it takes, so the
      // page would still scroll. Collapse the height to match.
      const naturalHeight = element.getBoundingClientRect().height;

      element.style.transformOrigin = 'top center';
      element.style.transform = `scale(${scale})`;
      element.style.height = `${naturalHeight * scale}px`;
    };

    // The union of the wrapper's children, not the wrapper: the wrapper is
    // full-width, so measuring it reports the page width for everything.
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
        contentType,
      };
    };

    /**
     * Refits and reports, if the box the embedder frames has moved.
     *
     * `force` is for the two cases with nothing to compare against: the first
     * measurement, and an answer the embedder explicitly asked for.
     */
    const refit = ({ force = false } = {}) => {
      applyFit();
      const next = measure();

      // Every number the embedder frames with, not just the size: a component
      // that keeps its own size while the frame changes width is recentred,
      // and an embedder cropping to a stale offset frames the wrong region.
      const moved =
        !last ||
        (['width', 'height', 'offsetX', 'offsetY'] as const).some(
          key => Math.abs(next[key] - last![key]) >= RESIZE_MIN_DELTA,
        );
      if (!moved && !force) return;

      last = next;

      post({
        type: PreviewMessageType.dimensions,
        version: PREVIEW_PROTOCOL_VERSION,
        payload: next,
      });

      // `postMessage` only reaches a parent. A screenshot runner loads this
      // page on its own, so the same numbers go onto the element, where
      // anything that can query the DOM can wait for them and read them.
      element.setAttribute(PreviewAttribute.width, String(next.width));
      element.setAttribute(PreviewAttribute.height, String(next.height));
      element.setAttribute(PreviewAttribute.offsetX, String(next.offsetX));
      element.setAttribute(PreviewAttribute.offsetY, String(next.offsetY));
      // Last, so all four are readable the moment this one appears.
      element.setAttribute(PreviewAttribute.ready, '');
    };

    /**
     * Refits at most once a frame.
     *
     * A dragged panel fires `resize` continuously, and every refit reads
     * layout back. Coalescing keeps a drag to one measurement per painted
     * frame; a measure request skips this and answers at once.
     */
    let scheduled = 0;
    const scheduleRefit = () => {
      if (scheduled) return;
      scheduled = requestAnimationFrame(() => {
        scheduled = 0;
        refit();
      });
    };

    // Answered before the first measurement too: an embedder that asks early
    // gets its answer when the layout settles, rather than silence.
    window.addEventListener(
      'message',
      (event: MessageEvent) => {
        if (!isMeasureRequest(event.data)) return;

        // The origins the site trusts to hear a measurement are the origins
        // it takes a request from. An embedder cannot name itself in either
        // direction.
        if (!canPost || !targets.split(' ').includes(event.origin)) {
          // Logged: a request dropped on the origin check looks exactly like
          // one that was never delivered.
          if (isDev()) {
            console.debug(
              '[optimizely] preview ✕ measure from',
              event.origin,
              '— not in',
              targets || '(no parentOrigin configured)',
            );
          }
          return;
        }

        // A request that arrives before the first measurement is not dropped:
        // that measurement is still coming, and carries the same numbers a
        // forced answer would. Said out loud, because from the embedder's
        // side an unanswered request and a lost one look identical.
        if (isDev()) {
          console.debug(
            '[optimizely] preview ←',
            PreviewMessageType.measure,
            last ? '' : '(not measured yet — the first measurement answers it)',
          );
        }
        if (last) refit({ force: true });
      },
      { signal: listening.signal },
    );

    settled(element).then(() => {
      if (cancelled) return;

      // The first measurement is the readiness signal, and goes out
      // unconditionally — there is nothing yet to compare it against.
      refit({ force: true });

      // Kept open: a late font or lazy image changes the height after any
      // reasonable readiness signal.
      observer = new ResizeObserver(scheduleRefit);
      observer.observe(element);

      // The observer only sees the component's own box. A frame that changed
      // height alone leaves that box untouched, so the fit would go stale and
      // the component be clipped by a frame it no longer fits.
      window.addEventListener('resize', scheduleRefit, {
        signal: listening.signal,
      });
    });

    return () => {
      cancelled = true;
      observer?.disconnect();
      listening.abort();
      cancelAnimationFrame(scheduled);
    };
  }, [contentType, targets, error?.code, error?.message, fit]);

  return null;
}
