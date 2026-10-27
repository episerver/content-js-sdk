/**
 * The message protocol between a preview document and the page embedding it.
 *
 * A parent cannot measure across origins, so a preview reports its own size.
 * Types and constants only, so a parent on any framework can import them.
 *
 * @module
 */

/** Bumped only for breaking changes. Adding a message or field is not one. */
export const PREVIEW_PROTOCOL_VERSION = 1;

/** Namespaced, so other messaging on the page cannot collide. */
export const PREVIEW_MESSAGE_PREFIX = 'optimizely:preview:';

/** The element a preview measures: the component's box, not the document's. */
export const PREVIEW_ELEMENT_ID = 'optimizely-preview';

/** Below this, a change is jitter rather than a resize worth reporting. */
export const RESIZE_MIN_DELTA = 8;

/** Past any real component, short of breaking layout arithmetic. */
export const MAX_PREVIEW_DIMENSION = 20000;

/**
 * The same measurement, written onto {@linkcode PREVIEW_ELEMENT_ID} as it is
 * sent.
 *
 * `postMessage` only reaches a parent, so a tool that loads the preview as a
 * page of its own — a screenshot runner, usually — would otherwise have no
 * way to learn the box or to know when the component had settled. Attributes
 * are readable by anything that can query the DOM.
 *
 * Wait for `ready`, read the four numbers, and use them as the capture's clip
 * rectangle. `error` appears instead when the component could not render, so
 * a runner can skip it rather than capture an empty page.
 */
export const PreviewAttribute = {
  /** Present once the first measurement is taken. Values are CSS pixels. */
  ready: 'data-preview-ready',
  width: 'data-preview-width',
  height: 'data-preview-height',
  x: 'data-preview-x',
  y: 'data-preview-y',
  /** The error code, when there is one. */
  error: 'data-preview-error',
} as const;

export const PreviewMessageType = {
  dimensions: `${PREVIEW_MESSAGE_PREFIX}dimensions`,
  error: `${PREVIEW_MESSAGE_PREFIX}error`,
  /** Parent → preview. The one message that travels that way. */
  measure: `${PREVIEW_MESSAGE_PREFIX}measure`,
} as const;

/** The box a component occupies, and where it sits in the preview. */
export type PreviewDimensions = {
  /** The component's own width, in CSS pixels. Not the page's. */
  width: number;
  /** The component's own height, in CSS pixels. */
  height: number;
  /** Offset from the preview's left edge, so a tile can frame the component. */
  offsetX: number;
  /** Offset from the preview's top edge. */
  offsetY: number;
  /** Echoed back so a parent can correlate. */
  contentType?: string;
};

/**
 * The component's box, as it is now.
 *
 * The first one is the readiness signal: fonts, images and layout have
 * settled, and a screenshot taken at that point is of a finished component.
 * Later ones mean it moved or changed size — a late font, a lazy image, or a
 * frame the embedder resized.
 *
 * One message rather than a `ready`/`resize` pair, because the payload is the
 * same either way and the parent already knows which it is: it is the first
 * if nothing has been received yet.
 */
export type PreviewDimensionsMessage = {
  type: typeof PreviewMessageType.dimensions;
  version: number;
  payload: PreviewDimensions;
};

/** The preview could not render, so the parent can fail fast. */
export type PreviewErrorMessage = {
  type: typeof PreviewMessageType.error;
  version: number;
  payload: {
    /** Open-ended: treat anything unrecognised as `render-failed`. */
    code: 'unknown-content-type' | 'render-failed' | (string & {});
    /** Untrusted text. Render as text, never as HTML. */
    message: string;
    contentType?: string;
  };
};

export type PreviewMessage = PreviewDimensionsMessage | PreviewErrorMessage;

/**
 * Asks the preview to measure itself again and answer, whether or not
 * anything moved.
 *
 * A preview refits itself when its own box changes, which covers a late font
 * or a component that reflows. It cannot see everything: a frame that only
 * grew taller, or a fixed-size component recentred in a frame that changed
 * width, leaves its box untouched and reports nothing. The embedder is the
 * one that knows it resized the frame, so it says so.
 */
export type PreviewMeasureRequest = {
  type: typeof PreviewMessageType.measure;
  version: number;
};

/** True for a measure request from an embedder. Shape only — check the origin. */
export function isMeasureRequest(data: unknown): data is PreviewMeasureRequest {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as PreviewMeasureRequest).type === PreviewMessageType.measure
  );
}

/**
 * True when a message is one of ours. A shape check only — the channel is
 * shared with every other library. Check `event.origin` and `event.source`
 * for whether the sender is trusted.
 */
export function isPreviewMessage(data: unknown): data is PreviewMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as PreviewMessage).type === 'string' &&
    (data as PreviewMessage).type.startsWith(PREVIEW_MESSAGE_PREFIX)
  );
}

/**
 * Checks a measurement before acting on it. Rejected rather than clamped: a
 * clamped value looks real and would be kept as the last good one.
 */
export function isValidDimensions(value: unknown): value is PreviewDimensions {
  const { width, height } = (value ?? {}) as PreviewDimensions;

  return (
    Number.isFinite(width) &&
    Number.isFinite(height) &&
    width > 0 &&
    height > 0 &&
    width <= MAX_PREVIEW_DIMENSION &&
    height <= MAX_PREVIEW_DIMENSION
  );
}
