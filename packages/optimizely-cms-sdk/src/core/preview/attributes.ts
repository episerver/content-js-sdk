import { InferredContentReference, type PreviewContext } from '../../infer.js';
import { appendToken, mediaToken } from '../../util/preview.js';

/** The parts of a content item the preview helpers read. */
type PreviewableContent = {
  __context?: PreviewContext;
  // Callers pass whole content objects; only `__context` is read.
  [key: string]: unknown;
};

/** Get context-aware functions for preview */
export function getPreviewUtils(content: PreviewableContent) {
  return {
    /** Get the HTML data attributes required for a property */
    pa(property?: string | { key: string }): Record<string, string> {
      if (content.__context?.edit) {
        if (typeof property === 'string') {
          return {
            'data-epi-edit': property,
          };
        } else if (property) {
          return {
            'data-epi-block-id': property.key,
          };
        }

        return {};
      } else {
        return {};
      }
    },

    /**
     * The URL of a ContentReference's asset, or of a plain URL string.
     * Carries the preview token only when the preview opted in with `usePreviewToken`.
     *
     * @param input - ContentReference from a DAM asset
     * @returns The asset URL, or undefined when there is none
     *
     * @example
     * ```tsx
     * const { src } = getPreviewUtils(content);
     *
     * <img
     *   src={src(content.image)}
     * />
     * ```
     */
    src(input: InferredContentReference | string | null | undefined): string | undefined {
      const previewToken = mediaToken(content.__context);

      // if input is an object with a URL
      if (typeof input === 'object' && input) {
        // if dam asset is selected the default URL is in input.url.default will be null
        const url = input.url?.default ?? input.item?.Url;
        if (url) {
          return appendToken(url, previewToken);
        }
      }

      // if input is a string URL
      if (typeof input === 'string') {
        return appendToken(input, previewToken);
      }

      return undefined;
    },
  };
}
