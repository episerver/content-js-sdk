/**
 * The message protocol between a preview document and the page embedding it.
 *
 * A parent cannot measure across origins, so a preview tells it how big the
 * component is. This module is the contract: the message types, the payload
 * shapes, and the checks a receiver runs before trusting one.
 *
 * The parent keeps the frame at a fixed layout width and scales it with a CSS
 * transform rather than resizing it. That is what keeps the exchange from
 * feeding back on itself: a transform does not change layout width, so a
 * component cannot reflow because it was scaled, and cannot report a new size
 * in response.
 *
 * Framework-agnostic: types and constants only, so a parent written against any
 * framework can import them to validate what it receives.
 *
 * @module
 */

/** Bumped only for breaking changes. Adding a message or a field is not one. */
export const PREVIEW_PROTOCOL_VERSION = 1;

/** Every message type starts with this, so other messaging on the page cannot collide. */
export const PREVIEW_MESSAGE_PREFIX = 'optimizely:preview:';

/** The element a preview measures. Its box is the component's, not the document's. */
export const PREVIEW_ELEMENT_ID = 'optimizely-preview';

/** Query parameter naming the origin a preview is allowed to post to. */
export const PARENT_ORIGIN_PARAM = 'parentOrigin';

/**
 * Height change, in CSS pixels, below which no `resize` is sent. Smaller moves
 * are sub-pixel reflow, scrollbar jitter or font smoothing, none of which are
 * worth a re-scale.
 */
export const RESIZE_MIN_DELTA = 8;

/** Past any real component, short of anything that breaks layout arithmetic. */
export const MAX_PREVIEW_DIMENSION = 20000;

export const PreviewMessageType = {
  ready: `${PREVIEW_MESSAGE_PREFIX}ready`,
  dimensions: `${PREVIEW_MESSAGE_PREFIX}dimensions`,
  resize: `${PREVIEW_MESSAGE_PREFIX}resize`,
  error: `${PREVIEW_MESSAGE_PREFIX}error`,
} as const;

/**
 * The box a component actually occupies, and where it sits.
 *
 * `width`/`height` describe the component, not the page around it: a button
 * in a 1280px-wide preview reports its own ~150px, so a tile can frame it
 * instead of showing a sliver adrift in whitespace. `offsetX`/`offsetY` say
 * where that box is within the preview, which is what lets a parent translate
 * it into the corner of a tile before scaling.
 */
export type PreviewDimensions = {
  /** The component's own width, in CSS pixels. */
  width: number;
  /** The component's own height, in CSS pixels. */
  height: number;
  /** Distance from the preview's left edge to the component's, in CSS pixels. */
  offsetX: number;
  /** Distance from the preview's top edge to the component's, in CSS pixels. */
  offsetY: number;
  /**
   * The layout width the preview was rendered at. Fixed by the parent and
   * never changed in response to a measurement — that is what makes the
   * scaling loop impossible. Reported so the message is self-describing.
   */
  viewportWidth: number;
  /** Which element was measured. {@linkcode PREVIEW_ELEMENT_ID} in v1. */
  element: string;
  /** The content type being previewed, so a parent can correlate. */
  contentType?: string;
};

/** Sent once, when fonts, images and layout have settled. */
export type PreviewReadyMessage = {
  type: typeof PreviewMessageType.ready;
  version: number;
  payload: PreviewDimensions;
};

/** Reserved for a parent-initiated measurement. Nothing emits it in v1. */
export type PreviewDimensionsMessage = {
  type: typeof PreviewMessageType.dimensions;
  version: number;
  payload: PreviewDimensions;
};

/** The component changed height after `ready`: late fonts, lazy images, animation. */
export type PreviewResizeMessage = {
  type: typeof PreviewMessageType.resize;
  version: number;
  payload: PreviewDimensions & { previousHeight: number };
};

/** The preview could not render, so the parent can fail fast instead of waiting. */
export type PreviewErrorMessage = {
  type: typeof PreviewMessageType.error;
  version: number;
  payload: {
    code: 'unknown-content-type' | 'no-component' | 'render-failed' | (string & {});
    /** Untrusted text. Render it as text, never as HTML. */
    message: string;
    contentType?: string;
  };
};

export type PreviewMessage =
  | PreviewReadyMessage
  | PreviewDimensionsMessage
  | PreviewResizeMessage
  | PreviewErrorMessage;

/**
 * True when a `MessageEvent`'s data is one of ours.
 *
 * Only a shape check: the page's `message` channel is shared with every other
 * library, so a parent needs to recognise its own traffic before reading it.
 * It says nothing about whether the sender is trusted — check `event.origin`
 * and `event.source` for that.
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
 * Checks a reported measurement before a parent acts on it.
 *
 * A preview is a separate document, so its payload is untrusted even when the
 * sender is: a buggy component reporting a billion pixels should be rejected
 * rather than clamped, because a clamped value is indistinguishable from a real
 * one and would be stored as the last good measurement.
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
